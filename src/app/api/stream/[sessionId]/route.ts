import { client } from "@/lib/api";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;
  const { task } = await request.json();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const run = client.run(task, { sessionId });

        for await (const msg of run) {
          const data = JSON.stringify(msg);
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        }

        // Send the final session result
        if (run.result) {
          const done = JSON.stringify({ __done: true, ...run.result });
          controller.enqueue(encoder.encode(`data: ${done}\n\n`));
        }
      } catch (err) {
        const error = JSON.stringify({ __error: true, message: String(err) });
        controller.enqueue(encoder.encode(`data: ${error}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
