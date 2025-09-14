import { useEffect, useRef, useState, useCallback } from "react";
import "./App.css";
import { exportComponentAsPNG } from "react-component-export-image";
import useThrottle from "./hooks/useThrottle";
import { Helmet, HelmetProvider } from "react-helmet-async";
import OpenAI from "openai";
import { ReactComponent as GuidelinesSVG } from "./guidelines.svg";

const packageJson = require("./../package.json");

const TRACKING_ID = process.env.REACT_APP_GA_ID;

const getRandomEmoji = (): string => {
  const emojiCodePoint =
    Math.floor(Math.random() * (0x1f64f - 0x1f600 + 1)) + 0x1f600;

  const emoji = String.fromCodePoint(emojiCodePoint);

  return emoji;
};

const COOL_COLORS = [
  "#F8F2D9",
  "#F7F1D8",
  "#F8F1DF",
  "#F7F0E7",
  "#F6E5CA",
  "#F9E6D1",
  "#F2E3DF",
  "#F5E1E2",
  "#F8DBE1",
  "#F5E4E4",
  "#EFDAE5",
  "#EDE0EC",
  "#DEE6EE",
  "#D5E5F0",
  "#D9E9EB",
  "#E9EDE8",
  "#E3EFD9",
  "#EBF0E7",
  "#F7F5E0",
  "#F2F1E6",
  "#F3EAC6",
  "#F3EBC7",
  "#F4E8D8",
  "#F8E0C7",
  "#F7E8D8",
  "#F7DED6",
  "#F1E6E6",
  "#E6D1DA",
  "#DAE6EF",
  "#E8EAEB",
];

const getRandomColor = (): string => {
  return COOL_COLORS[Math.floor(Math.random() * COOL_COLORS.length)];
};

const getViewport = (): number => {
  return Math.max(
    document.documentElement.clientWidth || 0,
    window.innerWidth || 0
  );
};

function App() {
  const [bgColor, setBgColor] = useState(getRandomColor());
  const [emoji, setEmoji] = useState(getRandomEmoji());
  const [canvasDistanceToTop, setCanvasDistanceToTop] = useState(0);
  const [scrollAmount, setScrollAmount] = useState(window.scrollY);
  const [viewPort, setViewport] = useState(getViewport());

  const [mode, setMode] = useState<"standard" | "ai" | "paste">("standard");
  const [openAiApiKey, setOpenAiApiKey] = useState(() => {
    return localStorage.getItem("openai-api-key") || "";
  });
  const [emojiDescription, setEmojiDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(
    null
  );
  const [imageSize, setImageSize] = useState(100);
  const [pastedImageUrl, setPastedImageUrl] = useState<string | null>(null);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);

  const throttledScrollAmount = useThrottle(scrollAmount);
  const throttledViewport = useThrottle(viewPort);

  const downloadRef = useRef<HTMLDivElement>(null);
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  const html2CanvasOptions = {
    y: canvasDistanceToTop + scrollAmount,
    useCORS: true,
    allowTaint: true,
    backgroundColor: null,
  };

  const handleDownloadImage = async () => {
    if (mode === "ai" && generatedImageUrl) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (mode === "paste" && pastedImageUrl) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    exportComponentAsPNG(downloadRef, {
      fileName: "emojipic.png",
      html2CanvasOptions,
    });
  };

  const handlePaste = useCallback(
    async (event: Event) => {
      const clipboardEvent = event as ClipboardEvent;
      if (mode !== "paste") return;

      const items = clipboardEvent.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf("image") !== -1) {
          const file = item.getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
              const result = e.target?.result;
              if (typeof result === "string") {
                setPastedImageUrl(result);
              }
            };
            reader.readAsDataURL(file);
          }
          break;
        }
      }
    },
    [mode]
  );

  const handleHiddenInputPaste = async (
    event: React.ClipboardEvent<HTMLInputElement>
  ) => {
    if (mode !== "paste") return;

    const items = event.clipboardData?.items;
    if (!items) return;

    event.preventDefault();

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf("image") !== -1) {
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const result = e.target?.result;
            if (typeof result === "string") {
              setPastedImageUrl(result);
            }
          };
          reader.readAsDataURL(file);
        }
        break;
      }
    }

    if (hiddenInputRef.current) {
      hiddenInputRef.current.value = "";
      hiddenInputRef.current.blur();
    }
  };

  const updateDistanceToTop = () => {
    const canvaselement = downloadRef.current;
    const distanceToTop = canvaselement?.getBoundingClientRect().top ?? 0;
    setCanvasDistanceToTop(distanceToTop);
  };

  useEffect(() => {
    updateDistanceToTop();
  }, [throttledScrollAmount]);

  useEffect(() => {
    updateDistanceToTop();
  }, [throttledViewport]);

  useEffect(() => {
    updateDistanceToTop();
  }, []);

  const resizeHandler = () => {
    setViewport(getViewport());
  };

  const scrollHandler = () => {
    setScrollAmount(window.scrollY);
  };

  useEffect(() => {
    window.addEventListener("resize", resizeHandler, false);
    window.addEventListener("scroll", scrollHandler, false);
    window.addEventListener("paste", handlePaste, false);

    return () => {
      window.removeEventListener("resize", resizeHandler, false);
      window.removeEventListener("scroll", scrollHandler, false);
      window.removeEventListener("paste", handlePaste, false);
    };
  }, [mode, handlePaste]);

  useEffect(() => {
    if (mode !== "paste") {
      setPastedImageUrl(null);
    }
    if (mode !== "ai") {
      setGeneratedImageUrl(null);
    }
  }, [mode]);

  useEffect(() => {
    if (openAiApiKey) {
      localStorage.setItem("openai-api-key", openAiApiKey);
    }
  }, [openAiApiKey]);

  const createAntiShadowPrompt = (description: string): string => {
    return `Apple style emoji of: "${description}". Clean white background.`;
  };

  const removeBackground = (imageDataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d")!;

        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        const corners = [
          { x: 0, y: 0 },
          { x: canvas.width - 1, y: 0 },
          { x: 0, y: canvas.height - 1 },
          { x: canvas.width - 1, y: canvas.height - 1 },
        ];

        const cornerColors: { [key: string]: number } = {};
        corners.forEach((corner) => {
          const index = (corner.y * canvas.width + corner.x) * 4;
          const r = data[index];
          const g = data[index + 1];
          const b = data[index + 2];
          const colorKey = `${r},${g},${b}`;
          cornerColors[colorKey] = (cornerColors[colorKey] || 0) + 1;
        });

        const bgColor = Object.entries(cornerColors)
          .sort(([, a], [, b]) => b - a)[0][0]
          .split(",")
          .map(Number);

        const tolerance = 30;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          const dr = Math.abs(r - bgColor[0]);
          const dg = Math.abs(g - bgColor[1]);
          const db = Math.abs(b - bgColor[2]);

          if (dr < tolerance && dg < tolerance && db < tolerance) {
            data[i + 3] = 0;
          }
        }

        ctx.putImageData(imageData, 0, 0);

        resolve(canvas.toDataURL("image/png"));
      };
      img.crossOrigin = "anonymous";
      img.src = imageDataUrl;
    });
  };

  const generateAiEmoji = async () => {
    setIsGenerating(true);

    try {
      const openai = new OpenAI({
        apiKey: openAiApiKey,
        dangerouslyAllowBrowser: true,
      });

      const enhancedPrompt = createAntiShadowPrompt(emojiDescription);

      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: enhancedPrompt,
        n: 1,
        size: "1024x1024",
        response_format: "b64_json",
      });

      const b64 = response.data?.[0]?.b64_json;
      if (b64) {
        const dataUrl = `data:image/png;base64,${b64}`;

        const transparentDataUrl = await removeBackground(dataUrl);
        setGeneratedImageUrl(transparentDataUrl);
      } else {
        throw new Error("No base64 image received from OpenAI");
      }
    } catch (error) {
      console.error("Error generating AI emoji:", error);
      alert("Error generating emoji. Please check your API key and try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <HelmetProvider>
      <Helmet>
        <script
          src={`https://www.googletagmanager.com/gtag/js?id=${TRACKING_ID}`}
          async
        ></script>
        <script>
          {`window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${TRACKING_ID}');`}
        </script>
      </Helmet>
      <div className="shadow-lg mt-4 lg:mt-8 p-4 sm:p-8 bg-slate-50 max-w-6xl ml-4 mr-4 lg:ml-auto lg:mr-auto rounded-lg">
        <h1 id="appTitle" className="text-4xl font-bold mb-4">
          Emojipic
        </h1>

        <div className="mb-6">
          <label className="font-bold block mb-2">Mode:</label>

          <div className="relative inline-block w-64">
            <select
              value={mode}
              onChange={(e) =>
                setMode(e.target.value as "standard" | "ai" | "paste")
              }
              style={{ WebkitAppearance: "none", MozAppearance: "none" }}
              className="appearance-none block w-full bg-gray-200 border-2 border-gray-200 rounded py-2 pl-4 pr-10 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-sky-500 text-md font-regular"
              aria-label="Mode"
            >
              <option value="standard">Standard Mode</option>
              <option value="ai">AI Mode</option>
              <option value="paste">Paste Mode</option>
            </select>

            {/* custom arrow */}
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6 8l4 4 4-4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        <div className="flex justify-between mt-0 sm:mt-6 flex-col lg:flex-row">
          <div className="w-full">
            {mode === "ai" ? (
              <>
                <label className="font-bold block">OpenAI API Key:</label>
                <input
                  type="password"
                  value={openAiApiKey}
                  onChange={(e) => setOpenAiApiKey(e.target.value)}
                  placeholder="Enter your OpenAI API key"
                  className="bg-gray-200 appearance-none border-2 border-gray-200 rounded w-full max-w-sm py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-sky-500 mb-4"
                />

                <label className="font-bold block">Describe your emoji:</label>
                <textarea
                  value={emojiDescription}
                  onChange={(e) => setEmojiDescription(e.target.value)}
                  placeholder="Describe the emoji you want to generate (e.g., a happy cat wearing sunglasses)"
                  rows={3}
                  className="bg-gray-200 h-32 appearance-none border-2 border-gray-200 rounded w-full max-w-sm py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-sky-500 mb-4"
                />

                <label className="font-bold block mb-2">
                  Image Size: {imageSize}%
                </label>
                <input
                  disabled={generatedImageUrl === null}
                  id="image-size-range"
                  type="range"
                  min="10"
                  max="100"
                  step="1"
                  value={imageSize}
                  onChange={(e) => setImageSize(Number(e.target.value))}
                  onMouseDown={() => setIsDraggingSlider(true)}
                  onMouseUp={() => setIsDraggingSlider(false)}
                  onTouchStart={() => setIsDraggingSlider(true)}
                  onTouchEnd={() => setIsDraggingSlider(false)}
                  className="w-full max-w-sm h-2 mb-4 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />

                <button
                  onClick={generateAiEmoji}
                  disabled={
                    isGenerating ||
                    !openAiApiKey.trim() ||
                    !emojiDescription.trim()
                  }
                  className="bg-blue-500 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded block mb-4"
                >
                  {isGenerating ? "Generating..." : "Generate"}
                </button>

                <br />
              </>
            ) : mode === "paste" ? (
              <>
                <label className="font-bold block mb-2">
                  Image Size: {imageSize}%
                </label>
                <input
                  disabled={pastedImageUrl === null}
                  id="image-size-range"
                  type="range"
                  min="10"
                  max="100"
                  step="1"
                  value={imageSize}
                  onChange={(e) => setImageSize(Number(e.target.value))}
                  onMouseDown={() => setIsDraggingSlider(true)}
                  onMouseUp={() => setIsDraggingSlider(false)}
                  onTouchStart={() => setIsDraggingSlider(true)}
                  onTouchEnd={() => setIsDraggingSlider(false)}
                  className="w-full max-w-sm h-2 mb-4 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />

                <br />
              </>
            ) : (
              <>
                <label className="font-bold block">Emoji:</label>
                <input
                  type="text"
                  value={emoji}
                  onChange={(e) => setEmoji(e.target.value)}
                  size={1}
                  maxLength={2}
                  className="bg-gray-200 appearance-none border-2 border-gray-200 rounded w-40 py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-sky-500 text-2xl"
                />

                <button
                  className="font-medium text-blue-600 dark:text-blue-500 hover:underline block"
                  onClick={() => setEmoji(getRandomEmoji)}
                >
                  Randomize emoji
                </button>

                <br />
              </>
            )}

            <label className="font-bold block">Background color:</label>
            <input
              type="text"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              size={1}
              className="bg-gray-200 inline-block appearance-none border-2 border-gray-200 rounded w-40 py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-sky-500 text-2xl align-bottom"
            />

            <input
              type="color"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              className="ml-2 h-12 w-12"
            />

            <button
              className="font-medium text-blue-600 dark:text-blue-500 hover:underline block"
              onClick={() => setBgColor(getRandomColor)}
            >
              Randomize color
            </button>
          </div>
          <div>
            <div className="relative">
              <div className="absolute lg:h-[600px] w-full h-[200px] flex items-center justify-center mt-0 ml-auto mr-auto select-none pointer-events-none">
                <div
                  className="lg:w-[600px] lg:h-[600px] w-[200px] h-[200px]"
                  style={{
                    backgroundColor: bgColor,
                    zIndex: 1,
                  }}
                >
                  <GuidelinesSVG className="lg:w-[600px] lg:h-[600px] w-[200px] h-[200px]" />
                </div>
              </div>

              <div
                ref={downloadRef}
                className="lg:w-[600px] lg:h-[600px] w-[200px] h-[200px] flex items-center justify-center mt-8 lg:mt-0 ml-auto mr-auto select-none"
                style={{
                  backgroundColor: bgColor,
                  opacity:
                    (mode === "ai" || mode === "paste") && isDraggingSlider
                      ? 0.8
                      : 1,
                  transition: "opacity 0.2s ease-in-out",
                  position: "relative",
                  zIndex: 2,
                }}
              >
                {mode === "ai" ? (
                  isGenerating ? (
                    <span className="text-9xl bounce-animation">⌛</span>
                  ) : generatedImageUrl ? (
                    <img
                      crossOrigin="anonymous"
                      src={generatedImageUrl}
                      alt="AI Generated Emoji"
                      className="object-contain"
                      style={{
                        width: `${imageSize}%`,
                        height: `${imageSize}%`,
                        maxWidth: "100%",
                        maxHeight: "100%",
                      }}
                    />
                  ) : null
                ) : mode === "paste" ? (
                  pastedImageUrl ? (
                    <img
                      onClick={() => setPastedImageUrl(null)}
                      src={pastedImageUrl}
                      alt="Pasted content"
                      className="object-contain"
                      style={{
                        width: `${imageSize}%`,
                        height: `${imageSize}%`,
                        maxWidth: "100%",
                        maxHeight: "100%",
                      }}
                    />
                  ) : (
                    <div className="text-center text-gray-500 w-full h-full flex flex-col items-center justify-center relative">
                      <div className="text-6xl mb-4">📋</div>
                      <div className="text-lg mb-4 hidden md:inline-block">
                        Paste an image here (Ctrl+V or Cmd+V)
                      </div>

                      <input
                        ref={hiddenInputRef}
                        type="text"
                        placeholder="Paste an image here"
                        onPaste={handleHiddenInputPaste}
                        onClick={(e) => {
                          const target = e.target as HTMLInputElement;
                          target.select();
                        }}
                        onFocus={(e) => {
                          const target = e.target as HTMLInputElement;
                          target.select();
                        }}
                        className="md:hidden w-40 px-3 py-2 text-center text-sm bg-white bg-opacity-20 border border-gray-300 border-opacity-50 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 focus:border-blue-500"
                        style={{ backdropFilter: "blur(10px)" }}
                      />
                    </div>
                  )
                ) : (
                  <span className="text-emojiSmall lg:text-emoji">{emoji}</span>
                )}
              </div>
            </div>

            <div className="text-center mt-8">
              <button
                type="button"
                onClick={handleDownloadImage}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Download PNG
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4 text-xs md:text-sm text-slate-600 text-left md:text-center leading-5 ml-6 mr-4 mb-4">
        Made by&nbsp;
        <a
          className="border-b-2 border-slate-600 border-dotted"
          target="_blank"
          href="https://antoniocosentino.com"
          rel="noreferrer"
        >
          Antonio Cosentino
        </a>{" "}
        &copy; 2023 - 2025 ·{" "}
        <span className="hidden md:inline-block">&nbsp;</span>
        <a
          target="_blank"
          href="https://github.com/antoniocosentino/emojipic"
          rel="noreferrer"
        >
          <img
            alt="Github"
            className="w-3 h-3 inline-block bottom-0.5 relative"
            src="https://antoniocosentino.github.io/what-the-fout/github.svg"
          />
        </a>
        &nbsp;
        <a
          className="border-b-2 border-slate-600 border-dotted"
          target="_blank"
          href="https://github.com/antoniocosentino/emojipic"
          rel="noreferrer"
        >
          Source Code
        </a>{" "}
        · v.{packageJson.version}
      </div>
    </HelmetProvider>
  );
}

export default App;
