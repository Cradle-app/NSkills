# @cradle/superposition-meow-domains

Superposition .meow domain resolution and registration hooks for React applications. Built on the Punk Domains protocol.

## Installation

```bash
npm install @cradle/superposition-meow-domains
# or
pnpm add @cradle/superposition-meow-domains
```

## Peer Dependencies

This package requires the following peer dependencies:

```bash
npm install react wagmi viem @tanstack/react-query
```

## Usage

### Resolve a .meow Domain

```tsx
import { useMeowDomain } from '@cradle/superposition-meow-domains';

function ProfileCard({ domain }: { domain: string }) {
  const { address, metadata, isLoading, error } = useMeowDomain(domain);

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;
  if (!address) return <p>Domain not found</p>;

  return (
    <div>
      <h3>{domain}</h3>
      <p>Owner: {address}</p>
      {metadata?.twitter && <p>Twitter: @{metadata.twitter}</p>}
      {metadata?.url && <a href={metadata.url}>Website</a>}
    </div>
  );
}
```

### Reverse Lookup (Address to Domain)

```tsx
import { useMeowReverseLookup } from '@cradle/superposition-meow-domains';

function AddressDisplay({ address }: { address: `0x${string}` }) {
  const { domain, isLoading } = useMeowReverseLookup(address);

  if (isLoading) return <span>Loading...</span>;

  return (
    <span>
      {domain || `${address.slice(0, 6)}...${address.slice(-4)}`}
    </span>
  );
}
```

### Register a .meow Domain

```tsx
import { useRegisterMeowDomain } from '@cradle/superposition-meow-domains';
import { formatEther } from 'viem';

function RegisterDomain() {
  const { 
    register, 
    checkAvailability, 
    getPrice, 
    isLoading,
    txHash 
  } = useRegisterMeowDomain();

  const handleRegister = async (name: string) => {
    // Check availability
    const available = await checkAvailability(name);
    if (!available) {
      alert('Domain not available');
      return;
    }

    // Check price
    const price = await getPrice(name);
    console.log('Price:', formatEther(price), 'ETH');

    // Register with optional metadata
    const hash = await register(name, undefined, {
      twitter: 'myhandle',
      url: 'https://mywebsite.com',
    });

    console.log('Registration tx:', hash);
  };

  return (
    <div>
      <button 
        onClick={() => handleRegister('myname')}
        disabled={isLoading}
      >
        {isLoading ? 'Registering...' : 'Register myname.meow'}
      </button>
      {txHash && <p>TX: {txHash}</p>}
    </div>
  );
}
```

## API Reference

### `useMeowDomain(domain, options?)`

Resolves a .meow domain to its owner address and metadata.

**Parameters:**
- `domain: string` - The domain name (with or without .meow suffix)
- `options.network?: 'mainnet' | 'testnet'` - Network to use (default: 'mainnet')
- `options.fetchMetadata?: boolean` - Whether to fetch metadata (default: true)

**Returns:**
- `status: DomainStatus` - Current status
- `address: Address | null` - Owner address
- `domain: DomainInfo | null` - Full domain info
- `metadata: DomainMetadata | null` - Associated metadata
- `isLoading: boolean`
- `error: Error | null`
- `refetch: () => Promise<void>`

### `useMeowReverseLookup(address, options?)`

Looks up the primary .meow domain for an address.

**Parameters:**
- `address: Address | undefined` - The address to look up
- `options.network?: 'mainnet' | 'testnet'` - Network to use

**Returns:**
- `domain: string | null` - The primary domain
- `isLoading: boolean`
- `error: Error | null`

### `useRegisterMeowDomain(options?)`

Register new .meow domains.

**Parameters:**
- `options.network?: 'mainnet' | 'testnet'` - Network to use
- `options.referrer?: Address` - Referrer address for affiliate rewards

**Returns:**
- `status: DomainStatus`
- `error: Error | null`
- `isLoading: boolean`
- `txHash: string | null`
- `register: (name, duration?, metadata?) => Promise<string>`
- `checkAvailability: (name) => Promise<boolean>`
- `getPrice: (name, duration?) => Promise<bigint>`

## Domain Metadata

You can attach the following metadata to domains:

```typescript
interface DomainMetadata {
  twitter?: string;    // Twitter/X handle
  url?: string;        // Website URL
  email?: string;      // Email address
  avatar?: string;     // Avatar image URL
  description?: string; // Bio/description
}
```

## Network Support

- **Mainnet**: Chain ID 55244
- **Testnet**: Chain ID 98985

## Resources

- [Punk Domains Documentation](https://docs.punk.domains)
- [Superposition Documentation](https://docs.superposition.so)
- [Meow Domains App](https://meow.superposition.so)
