export async function pipeOpenAISSE(
  upstream: Response,
  transform: (parsed: any) => string | null
) {
  if (!upstream.ok) {
    const errorText = await upstream.text();
    throw new Error(`Upstream request failed: ${upstream.status} ${errorText}`);
  }

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = upstream.body?.getReader();
      const decoder = new TextDecoder();
      const encoder = new TextEncoder();

      if (!reader) {
        controller.close();
        return;
      }

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            controller.close();
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter((line) => line.trim());

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const outgoing = transform(parsed);
              if (!outgoing) continue;
              controller.enqueue(encoder.encode(`data: ${outgoing}\n\n`));
            } catch (error) {
              console.error('Failed to parse upstream SSE line', error);
            }
          }
        }
      } catch (error) {
        controller.error(error);
      }
    },
  });
}

export async function passThroughSSE(upstream: Response) {
  if (!upstream.ok) {
    const errorText = await upstream.text();
    throw new Error(`Upstream request failed: ${upstream.status} ${errorText}`);
  }
  return upstream.body;
}
