// Superposition Meow Domains ABIs
// @cradle/superposition-meow-domains
// Based on Punk Domains protocol

/**
 * Punk Domains TLD ABI (for .meow)
 */
export const PUNK_TLD_ABI = [
  // Domain resolution
  {
    inputs: [{ name: '_domainName', type: 'string' }],
    name: 'getDomainHolder',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: '_domainName', type: 'string' }],
    name: 'getDomainData',
    outputs: [
      { name: 'holder', type: 'address' },
      { name: 'data', type: 'string' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  
  // Reverse lookup
  {
    inputs: [{ name: '_address', type: 'address' }],
    name: 'defaultNames',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  
  // Domain registration
  {
    inputs: [
      { name: '_domainName', type: 'string' },
      { name: '_domainHolder', type: 'address' },
      { name: '_referrer', type: 'address' },
    ],
    name: 'mint',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  
  // Domain price
  {
    inputs: [],
    name: 'price',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  
  // Update domain data (metadata)
  {
    inputs: [
      { name: '_domainName', type: 'string' },
      { name: '_data', type: 'string' },
    ],
    name: 'editData',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'user', type: 'address' },
      { indexed: false, name: 'domainName', type: 'string' },
    ],
    name: 'DomainCreated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'user', type: 'address' },
      { indexed: false, name: 'domainName', type: 'string' },
    ],
    name: 'DataUpdated',
    type: 'event',
  },
] as const;
