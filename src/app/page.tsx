"use client";
import { useState } from "react";

export default function Home() {
  const [theInput, setTheInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi, ChatterBot this side! How can I help you today?",
    },
  ]);

  // 1. Add the fetchWithRetry function here
  const fetchWithRetry = async (url, options, retries = 3, delay = 1000) => {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        if (response.status === 429 && retries > 0) {
          console.log(`Rate limit exceeded. Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          return fetchWithRetry(url, options, retries - 1, delay * 2);
        }
        throw new Error("API error: " + response.status);
      }
      return response;
    } catch (error) {
      throw error;
    }
  };

  // 2. Update callGetResponse to use fetchWithRetry
  const callGetResponse = async () => {
    if (theInput.trim() === "") return;

    setIsLoading(true);
    const userMessage = { role: "user", content: theInput };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setTheInput("");

    try {
      let response = await fetchWithRetry("/api", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      const data = await response.json();
      setMessages((prevMessages) => [...prevMessages, data.output]);
    } catch (error) {
      console.error("Error fetching the response:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const Submit = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      callGetResponse();
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between px-24 py-5">
      <h1 className="text-5xl font-sans">ChatterBot</h1>

      <div className="flex  h-[35rem] w-[40rem] flex-col items-center bg-gray-600 rounded-xl">
        <div className="h-full flex flex-col gap-2 overflow-y-auto py-8 px-3 w-full">
          {messages.map((e) => {
            return (
              <div
                key={e.content}
                className={`w-max max-w-[18rem] rounded-md px-4 py-3 h-min ${
                  e.role === "assistant"
                    ? "self-start  bg-gray-200 text-gray-800"
                    : "self-end  bg-gray-800 text-gray-50"
                }`}
              >
                {e.content}
              </div>
            );
          })}

          {isLoading ? (
            <div className="self-start bg-gray-200 text-gray-800 w-max max-w-[18rem] rounded-md px-4 py-3 h-min">
              --Wait--
            </div>
          ) : (
            ""
          )}
        </div>

        <div className="relative w-[80%] bottom-4 flex justify-center">
          <textarea
            value={theInput}
            onChange={(event) => setTheInput(event.target.value)}
            className="w-[85%] h-10 px-3 py-2 resize-none overflow-y-auto text-black bg-gray-300 rounded-l outline-none"
            onKeyDown={Submit}
          />
          <button
            onClick={callGetResponse}
            className="w-[15%] bg-blue-500 px-4 py-2 rounded-r"
          >
            Send
          </button>
        </div>
      </div>
    </main>
  );
}
