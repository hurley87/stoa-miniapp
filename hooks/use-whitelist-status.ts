import { useReadContracts } from 'wagmi';
import { STOA_FACTORY_ADDRESS, STOA_FACTORY_ABI } from '@/lib/abis/StoaFactory';

// Known addresses that might be whitelisted (can be expanded)
const KNOWN_ADDRESSES = [
  '0x26e94d56892521c4c7bbbd1d9699725932797e9c',
  '0xeFe07d20e9b15aCc922457060B93DA1052F60ea3',
  '0x891161c0fdd4797c79400ca2256a967bd6198450',
  // Add more addresses as needed
];

export function useWhitelistStatus() {
  const contracts = KNOWN_ADDRESSES.map((address) => ({
    address: STOA_FACTORY_ADDRESS,
    abi: STOA_FACTORY_ABI,
    functionName: 'isWhitelisted',
    args: [address as `0x${string}`],
  }));

  const { data, isError, isLoading } = useReadContracts({
    contracts,
  });

  const whitelistedAccounts = KNOWN_ADDRESSES.filter((address, index) => {
    const result = data?.[index];
    if (result?.status === 'success') {
      const contractResult = result.result as unknown as boolean;
      return contractResult === true;
    }
    return false;
  }).map((addr) => addr.toLowerCase());

  const accountsWithStatus = KNOWN_ADDRESSES.map((address, index) => {
    const result = data?.[index];
    const isWhitelisted =
      result?.status === 'success'
        ? (result.result as unknown as boolean) === true
        : false;
    return {
      address: address.toLowerCase(),
      isWhitelisted,
      isLoading: isLoading,
      error: result?.error,
    };
  });

  return {
    whitelistedAccounts,
    accountsWithStatus,
    isLoading,
    isError,
  };
}

export function useIsWhitelisted(address?: string) {
  const { data, isError, isLoading } = useReadContracts({
    contracts: address
      ? [
          {
            address: STOA_FACTORY_ADDRESS,
            abi: STOA_FACTORY_ABI,
            functionName: 'isWhitelisted',
            args: [address as `0x${string}`],
          },
        ]
      : [],
  });

  const result = data?.[0];
  const isWhitelisted =
    result?.status === 'success'
      ? (result.result as unknown as boolean) === true
      : false;

  return {
    isWhitelisted,
    isLoading,
    isError,
  };
}
