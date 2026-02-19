// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

/**
 * @title  SimpleMarketplace
 * @notice A peer-to-peer marketplace with escrow protection.
 *         Sellers list items, buyers purchase them, and funds are held in escrow
 *         until the buyer confirms delivery. If there's a dispute, the owner
 *         can mediate and release funds to either party.
 *
 * HOW IT WORKS:
 *  1. Seller calls listItem() with item details and price.
 *  2. Buyer calls purchaseItem() and sends the exact ETH price - funds go into escrow.
 *  3. After receiving the item, buyer calls confirmDelivery() - seller gets paid.
 *  4. If item never arrives, buyer calls raiseDispute() - owner mediates.
 *  5. Owner can refundBuyer() or releaseFundsToSeller() to resolve dispute.
 *  6. Seller can cancel unsold listings anytime.
 *
 * DEPLOY ON REMIX:
 *  - No constructor args needed
 *  - Deploy and start listing items immediately
 */
contract SimpleMarketplace {

    // ─── Enums ────────────────────────────────────────────────
    enum ItemStatus {
        Available,      // Listed for sale
        Sold,           // Purchased, awaiting delivery confirmation
        Completed,      // Delivered and confirmed
        Disputed,       // Buyer raised a dispute
        Cancelled       // Seller cancelled the listing
    }

    // ─── Structs ──────────────────────────────────────────────
    struct Item {
        uint256 itemId;
        address seller;
        address buyer;
        string  name;
        string  description;
        uint256 price;          // in wei
        ItemStatus status;
        uint256 listedAt;
        uint256 purchasedAt;
        uint256 completedAt;
    }

    // ─── State ────────────────────────────────────────────────
    address public owner;
    uint256 public nextItemId;
    uint256 public platformFeePercent = 2;  // 2% fee on each sale

    mapping(uint256 => Item) public items;
    uint256[] public itemIds;

    // Track items by seller/buyer
    mapping(address => uint256[]) public itemsBySeller;
    mapping(address => uint256[]) public itemsByBuyer;

    // ─── Events ───────────────────────────────────────────────
    event ItemListed(
        uint256 indexed itemId,
        address indexed seller,
        string name,
        uint256 price
    );
    event ItemPurchased(
        uint256 indexed itemId,
        address indexed buyer,
        address indexed seller,
        uint256 price
    );
    event DeliveryConfirmed(
        uint256 indexed itemId,
        address indexed buyer,
        uint256 sellerPayout,
        uint256 platformFee
    );
    event DisputeRaised(
        uint256 indexed itemId,
        address indexed buyer
    );
    event DisputeResolved(
        uint256 indexed itemId,
        address indexed winner,
        uint256 amount
    );
    event ItemCancelled(
        uint256 indexed itemId,
        address indexed seller
    );
    event FeeUpdated(uint256 newFeePercent);

    // ─── Errors ───────────────────────────────────────────────
    error NotOwner();
    error NotSeller();
    error NotBuyer();
    error InvalidPrice();
    error InvalidItemId();
    error ItemNotAvailable();
    error ItemNotSold();
    error ItemNotDisputed();
    error IncorrectPayment(uint256 expected, uint256 sent);
    error TransferFailed();
    error InvalidFeePercent();

    // ─── Modifiers ────────────────────────────────────────────
    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier validItem(uint256 itemId) {
        if (itemId >= nextItemId) revert InvalidItemId();
        _;
    }

    // ─── Constructor ──────────────────────────────────────────
    constructor() {
        owner = msg.sender;
        nextItemId = 1; // Start IDs at 1 (0 means invalid)
    }

    // ─── Seller Functions ─────────────────────────────────────

    /**
     * @notice List a new item for sale.
     * @param name Item name
     * @param description Item description
     * @param price Price in wei (e.g., 1000000000000000 = 0.001 ETH)
     */
    function listItem(
        string calldata name,
        string calldata description,
        uint256 price
    ) external returns (uint256 itemId) {
        if (price == 0) revert InvalidPrice();
        if (bytes(name).length == 0) revert InvalidPrice();

        itemId = nextItemId++;

        items[itemId] = Item({
            itemId:       itemId,
            seller:       msg.sender,
            buyer:        address(0),
            name:         name,
            description:  description,
            price:        price,
            status:       ItemStatus.Available,
            listedAt:     block.timestamp,
            purchasedAt:  0,
            completedAt:  0
        });

        itemIds.push(itemId);
        itemsBySeller[msg.sender].push(itemId);

        emit ItemListed(itemId, msg.sender, name, price);
    }

    /**
     * @notice Cancel an unsold listing.
     * @param itemId The item ID to cancel
     */
    function cancelItem(uint256 itemId) external validItem(itemId) {
        Item storage item = items[itemId];

        if (item.seller != msg.sender) revert NotSeller();
        if (item.status != ItemStatus.Available) revert ItemNotAvailable();

        item.status = ItemStatus.Cancelled;

        emit ItemCancelled(itemId, msg.sender);
    }

    // ─── Buyer Functions ──────────────────────────────────────

    /**
     * @notice Purchase an item. Send exact ETH equal to item price.
     * @param itemId The item ID to purchase
     */
    function purchaseItem(uint256 itemId) external payable validItem(itemId) {
        Item storage item = items[itemId];

        if (item.status != ItemStatus.Available) revert ItemNotAvailable();
        if (msg.value != item.price) 
            revert IncorrectPayment(item.price, msg.value);

        item.buyer       = msg.sender;
        item.status      = ItemStatus.Sold;
        item.purchasedAt = block.timestamp;

        itemsByBuyer[msg.sender].push(itemId);

        emit ItemPurchased(itemId, msg.sender, item.seller, item.price);
    }

    /**
     * @notice Confirm you received the item. Releases funds to seller.
     * @param itemId The item ID to confirm
     */
    function confirmDelivery(uint256 itemId) external validItem(itemId) {
        Item storage item = items[itemId];

        if (item.buyer != msg.sender) revert NotBuyer();
        if (item.status != ItemStatus.Sold) revert ItemNotSold();

        item.status      = ItemStatus.Completed;
        item.completedAt = block.timestamp;

        // Calculate platform fee and seller payout
        uint256 fee          = (item.price * platformFeePercent) / 100;
        uint256 sellerPayout = item.price - fee;

        // Transfer to seller
        (bool sellerOk,) = payable(item.seller).call{value: sellerPayout}("");
        if (!sellerOk) revert TransferFailed();

        // Transfer fee to platform owner
        if (fee > 0) {
            (bool feeOk,) = payable(owner).call{value: fee}("");
            if (!feeOk) revert TransferFailed();
        }

        emit DeliveryConfirmed(itemId, msg.sender, sellerPayout, fee);
    }

    /**
     * @notice Raise a dispute if item was not delivered or is not as described.
     * @param itemId The item ID in question
     */
    function raiseDispute(uint256 itemId) external validItem(itemId) {
        Item storage item = items[itemId];

        if (item.buyer != msg.sender) revert NotBuyer();
        if (item.status != ItemStatus.Sold) revert ItemNotSold();

        item.status = ItemStatus.Disputed;

        emit DisputeRaised(itemId, msg.sender);
    }

    // ─── Owner Dispute Resolution ─────────────────────────────

    /**
     * @notice Refund the buyer in case of a dispute.
     * @param itemId The disputed item ID
     */
    function refundBuyer(uint256 itemId) external onlyOwner validItem(itemId) {
        Item storage item = items[itemId];

        if (item.status != ItemStatus.Disputed) revert ItemNotDisputed();

        item.status      = ItemStatus.Completed; // Mark as resolved
        item.completedAt = block.timestamp;

        (bool ok,) = payable(item.buyer).call{value: item.price}("");
        if (!ok) revert TransferFailed();

        emit DisputeResolved(itemId, item.buyer, item.price);
    }

    /**
     * @notice Release funds to seller in case dispute favors them.
     * @param itemId The disputed item ID
     */
    function releaseFundsToSeller(uint256 itemId) 
        external 
        onlyOwner 
        validItem(itemId) 
    {
        Item storage item = items[itemId];

        if (item.status != ItemStatus.Disputed) revert ItemNotDisputed();

        item.status      = ItemStatus.Completed; // Mark as resolved
        item.completedAt = block.timestamp;

        // No fee taken on disputed resolutions - full amount to seller
        (bool ok,) = payable(item.seller).call{value: item.price}("");
        if (!ok) revert TransferFailed();

        emit DisputeResolved(itemId, item.seller, item.price);
    }

    // ─── Owner Admin ──────────────────────────────────────────

    /**
     * @notice Update platform fee percentage (0-10%).
     * @param newFeePercent New fee percentage (e.g., 2 for 2%)
     */
    function updatePlatformFee(uint256 newFeePercent) external onlyOwner {
        if (newFeePercent > 10) revert InvalidFeePercent();
        platformFeePercent = newFeePercent;
        emit FeeUpdated(newFeePercent);
    }

    // ─── View Functions ───────────────────────────────────────

    /**
     * @notice Get full details of an item.
     */
    function getItem(uint256 itemId) 
        external 
        view 
        validItem(itemId) 
        returns (Item memory) 
    {
        return items[itemId];
    }

    /**
     * @notice Get all available items for sale.
     */
    function getAvailableItems() external view returns (Item[] memory) {
        // Count available items first
        uint256 count = 0;
        for (uint256 i = 0; i < itemIds.length; i++) {
            if (items[itemIds[i]].status == ItemStatus.Available) {
                count++;
            }
        }

        // Build array
        Item[] memory available = new Item[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < itemIds.length; i++) {
            uint256 id = itemIds[i];
            if (items[id].status == ItemStatus.Available) {
                available[index] = items[id];
                index++;
            }
        }

        return available;
    }

    /**
     * @notice Get all items listed by a specific seller.
     */
    function getSellerItems(address seller) 
        external 
        view 
        returns (Item[] memory) 
    {
        uint256[] memory ids = itemsBySeller[seller];
        Item[] memory sellerItems = new Item[](ids.length);

        for (uint256 i = 0; i < ids.length; i++) {
            sellerItems[i] = items[ids[i]];
        }

        return sellerItems;
    }

    /**
     * @notice Get all items purchased by a specific buyer.
     */
    function getBuyerItems(address buyer) 
        external 
        view 
        returns (Item[] memory) 
    {
        uint256[] memory ids = itemsByBuyer[buyer];
        Item[] memory buyerItems = new Item[](ids.length);

        for (uint256 i = 0; i < ids.length; i++) {
            buyerItems[i] = items[ids[i]];
        }

        return buyerItems;
    }

    /**
     * @notice Get total count of items in each status.
     */
    function getMarketplaceStats() external view returns (
        uint256 totalItems,
        uint256 availableItems,
        uint256 soldItems,
        uint256 completedItems,
        uint256 disputedItems,
        uint256 cancelledItems
    ) {
        totalItems = itemIds.length;

        for (uint256 i = 0; i < itemIds.length; i++) {
            ItemStatus status = items[itemIds[i]].status;

            if (status == ItemStatus.Available)  availableItems++;
            if (status == ItemStatus.Sold)       soldItems++;
            if (status == ItemStatus.Completed)  completedItems++;
            if (status == ItemStatus.Disputed)   disputedItems++;
            if (status == ItemStatus.Cancelled)  cancelledItems++;
        }
    }

    /**
     * @notice Check my purchases and sales summary.
     */
    function myActivity() external view returns (
        uint256 itemsListed,
        uint256 itemsPurchased,
        uint256 activeSales,
        uint256 activePurchases
    ) {
        itemsListed     = itemsBySeller[msg.sender].length;
        itemsPurchased  = itemsByBuyer[msg.sender].length;

        // Count active (unsold) listings
        for (uint256 i = 0; i < itemsListed; i++) {
            uint256 id = itemsBySeller[msg.sender][i];
            if (items[id].status == ItemStatus.Available) {
                activeSales++;
            }
        }

        // Count active (awaiting delivery) purchases
        for (uint256 i = 0; i < itemsPurchased; i++) {
            uint256 id = itemsByBuyer[msg.sender][i];
            if (items[id].status == ItemStatus.Sold) {
                activePurchases++;
            }
        }
    }
}

