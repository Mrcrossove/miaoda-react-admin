import ky, { type AfterResponseHook, type KyResponse, type NormalizedOptions } from 'ky';
import { createParser, type EventSourceParser } from 'eventsource-parser';

export interface SSEOptions {
  onData: (data: string) => void;
  onEvent?: (event: any) => void;
  onCompleted?: (error?: Error) => void;
  onAborted?: () => void;
}

export const createSSEHook = (options: SSEOptions): AfterResponseHook => {
  const hook: AfterResponseHook = async (
    request: Request,
    _options: NormalizedOptions,
    response: KyResponse
  ) => {
    if (!response.ok || !response.body) {
      return;
    }

    let completed = false;
    const innerOnCompleted = (error?: Error): void => {
      if (completed) return;
      completed = true;
      options.onCompleted?.(error);
    };

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf8');
    const parser: EventSourceParser = createParser({
      onEvent: (event) => {
        if (!event.data) return;
        options.onEvent?.(event);
        const dataArray: string[] = event.data.split('\n');
        for (const data of dataArray) {
          if (data.trim()) {
            options.onData(data);
          }
        }
      },
    });

    const read = (): void => {
      reader
        .read()
        .then((result) => {
          if (result.done) {
            innerOnCompleted();
            return;
          }

          parser.feed(decoder.decode(result.value, { stream: true }));
          read();
        })
        .catch((error) => {
          if (request.signal.aborted) {
            options.onAborted?.();
            return;
          }
          innerOnCompleted(error as Error);
        });
    };

    read();
    return response;
  };

  return hook;
};

export interface StreamRequestOptions {
  functionUrl: string;
  requestBody: any;
  supabaseAnonKey?: string;
  headers?: Record<string, string>;
  onData?: (data: string) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
  signal?: AbortSignal;
}

export const sendStreamRequest = async (options: StreamRequestOptions): Promise<void> => {
  const { functionUrl, requestBody, headers, onData, onComplete, onError, signal } = options;

  const sseHook = createSSEHook({
    onData: onData || (() => {}),
    onCompleted: (error?: Error) => {
      if (error) {
        onError?.(error);
      } else {
        onComplete?.();
      }
    },
    onAborted: () => {
      console.log('stream request aborted');
    },
  });

  try {
    await ky.post(functionUrl, {
      json: requestBody,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      signal,
      hooks: {
        afterResponse: [sseHook],
      },
    });
  } catch (error) {
    if (!signal?.aborted) {
      onError?.(error as Error);
    }
  }
};
