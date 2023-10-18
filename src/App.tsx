import { MutableRefObject, useRef, useState } from "react";
import "./App.css";

import { exportComponentAsPNG } from "react-component-export-image";

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

function App() {
  const [bgColor, setBgColor] = useState(getRandomColor());

  const [emoji, setEmoji] = useState(getRandomEmoji());

  const downloadRef = useRef(null) as MutableRefObject<null>;

  const vw = Math.max(
    document.documentElement.clientWidth || 0,
    window.innerWidth || 0
  );

  const html2CanvasOptions = {
    ...(vw < 1024 && { y: 364 }),
  };

  const handleDownloadImage = async () => {
    exportComponentAsPNG(downloadRef, {
      fileName: "emojipic.png",
      html2CanvasOptions,
    });
  };

  return (
    <>
      <div className="shadow-lg mt-4 lg:mt-8 p-8 bg-slate-50 max-w-6xl ml-4 mr-4 lg:ml-auto lg:mr-auto">
        <h1 className="text-4xl font-bold">Emoji to PNG</h1>

        <div className="flex justify-between mt-6 flex-col lg:flex-row">
          <div>
            <label className="font-bold">Emoji:</label>
            <input
              type="text"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              size={1}
              maxLength={2}
              className="bg-gray-200 appearance-none border-2 border-gray-200 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-sky-500 text-2xl"
            />

            <button
              className="font-medium text-blue-600 dark:text-blue-500 hover:underline"
              onClick={() => setEmoji(getRandomEmoji)}
            >
              Randomize emoji
            </button>

            <br />
            <br />

            <label className="font-bold">Background color:</label>
            <input
              type="text"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              size={1}
              className="bg-gray-200 appearance-none border-2 border-gray-200 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-sky-500 text-2xl"
            />

            <button
              className="font-medium text-blue-600 dark:text-blue-500 hover:underline"
              onClick={() => setBgColor(getRandomColor)}
            >
              Randomize color
            </button>
          </div>
          <div>
            <div
              ref={downloadRef}
              className="lg:w-[600px] lg:h-[600px] w-[200px] h-[200px] flex items-center justify-center mt-8 lg:mt-0 ml-auto mr-auto"
              style={{
                backgroundColor: bgColor,
              }}
            >
              <span className="text-emojiSmall lg:text-emoji">{emoji}</span>
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
      <div className="mt-4 text-sm text-slate-600 text-left md:text-center leading-6 ml-6 mr-4 mb-4">
        Made by&nbsp;
        <a
          className="border-b-2 border-slate-600 border-dotted"
          target="_blank"
          href="https://antoniocosentino.com"
          rel="noreferrer"
        >
          Antonio Cosentino
        </a>{" "}
        &copy; 2023 · <span className="hidden md:inline-block">&nbsp;</span>
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
        </a>
      </div>
    </>
  );
}

export default App;
