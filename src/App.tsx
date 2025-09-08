import { useEffect, useRef, useState } from "react";
import "./App.css";
import { exportComponentAsPNG } from "react-component-export-image";
import useThrottle from "./hooks/useThrottle";
import { Helmet, HelmetProvider } from "react-helmet-async";
import OpenAI from "openai";

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

  const [isAiMode, setIsAiMode] = useState(false);
  const [openAiApiKey, setOpenAiApiKey] = useState(() => {
    return localStorage.getItem("openai-api-key") || "";
  });
  const [emojiDescription, setEmojiDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(
    null
  );
  const [imageSize, setImageSize] = useState(100);

  const throttledScrollAmount = useThrottle(scrollAmount);
  const throttledViewport = useThrottle(viewPort);

  const downloadRef = useRef<HTMLDivElement>(null);

  const html2CanvasOptions = {
    y: canvasDistanceToTop + scrollAmount,
    useCORS: true,
    allowTaint: true,
    backgroundColor: null,
  };

  const handleDownloadImage = async () => {
    if (isAiMode && generatedImageUrl) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    exportComponentAsPNG(downloadRef, {
      fileName: "emojipic.png",
      html2CanvasOptions,
    });
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
  });

  useEffect(() => {
    if (openAiApiKey) {
      localStorage.setItem("openai-api-key", openAiApiKey);
    }
  }, [openAiApiKey]);

  const createAntiShadowPrompt = (description: string): string => {
    return `Flat emoji illustration of ${description}. NO shadows, NO depth, NO 3D effects, NO shading, NO highlights, NO gradients, NO drop shadows, NO cast shadows, NO directional lighting, NO volume, NO perspective, NO dimensionality. Pure flat design on white background. Try to imitate the Apple iOS emoji style as much as possible.`;
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
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isAiMode}
              onChange={(e) => setIsAiMode(e.target.checked)}
              className="sr-only peer"
            />
            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
            <span className="ms-3 text-lg font-bold text-gray-900">
              AI Mode
            </span>
          </label>
        </div>

        <div className="flex justify-between mt-0 sm:mt-6 flex-col lg:flex-row">
          <div className="w-full">
            {isAiMode ? (
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

                <label className="font-bold block mb-2">Image Size: {imageSize}%</label>
                <input
                  id="image-size-range"
                  type="range"
                  min="10"
                  max="100"
                  step="10"
                  value={imageSize}
                  onChange={(e) => setImageSize(Number(e.target.value))}
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
            <div
              ref={downloadRef}
              className="lg:w-[600px] lg:h-[600px] w-[200px] h-[200px] flex items-center justify-center mt-8 lg:mt-0 ml-auto mr-auto select-none"
              style={{
                backgroundColor: bgColor,
              }}
            >
              {isAiMode && generatedImageUrl ? (
                <img
                  crossOrigin="anonymous"
                  src={generatedImageUrl}
                  alt="AI Generated Emoji"
                  className="object-contain"
                  style={{
                    width: `${imageSize}%`,
                    height: `${imageSize}%`,
                    maxWidth: '100%',
                    maxHeight: '100%',
                  }}
                />
              ) : (
                <span
                  className={`${
                    isAiMode ? "hidden" : ""
                  } text-emojiSmall lg:text-emoji`}
                >
                  {emoji}
                </span>
              )}
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
        All rights reserved ·{" "}
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
