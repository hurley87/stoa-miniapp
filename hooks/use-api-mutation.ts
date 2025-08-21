import { useMutation, UseMutationOptions } from '@tanstack/react-query';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface UseApiMutationOptions<TData, TVariables>
  extends Omit<UseMutationOptions<TData, Error, TVariables>, 'mutationFn'> {
  url: string | ((variables: TVariables) => string);
  method?: HttpMethod;
  isProtected?: boolean;
  body?: (variables: TVariables) => unknown;
}

export const useApiMutation = <TData, TVariables = unknown>(
  options: UseApiMutationOptions<TData, TVariables>
) => {
  const {
    url,
    method = 'POST',
    isProtected = true,
    ...mutationOptions
  } = options;

  return useMutation<TData, Error, TVariables>({
    ...mutationOptions,
    mutationFn: async (variables) => {
      const resolvedUrl = typeof url === 'function' ? url(variables) : url;
      const resolvedBody = options.body
        ? options.body(variables)
        : (variables as unknown);

      const response = await fetch(resolvedUrl, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        ...(isProtected && {
          credentials: 'include',
        }),
        ...(resolvedBody !== undefined && resolvedBody !== null
          ? { body: JSON.stringify(resolvedBody) }
          : {}),
      });

      if (!response.ok) {
        // Try to parse JSON error, else fall back to text
        let errorMessage = `API Error: ${response.status}`;
        try {
          const maybeJson = await response.json();
          if (
            maybeJson &&
            typeof maybeJson === 'object' &&
            'error' in maybeJson
          ) {
            errorMessage = (maybeJson as Record<string, unknown>)
              .error as string;
          } else {
            errorMessage = JSON.stringify(maybeJson);
          }
        } catch {
          try {
            const text = await response.text();
            if (text) errorMessage = text;
          } catch {
            // ignore
          }
        }
        throw new Error(errorMessage);
      }

      // Successful response parsing guard
      try {
        return await response.json();
      } catch {
        // If no content or invalid JSON, throw explicit error
        throw new Error('Unexpected end of JSON input');
      }
    },
  });
};
