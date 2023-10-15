import { MutableRefObject, useRef, useState } from "react";
import "./App.css";

import { exportComponentAsPNG } from "react-component-export-image";

const getRandomEmoji = (): string => {
  // Generate a random code point within the emoji range (U+1F600 - U+1F64F)
  const emojiCodePoint =
    Math.floor(Math.random() * (0x1f64f - 0x1f600 + 1)) + 0x1f600;

  // Convert the code point to a JavaScript string
  const emoji = String.fromCodePoint(emojiCodePoint);

  return emoji;
};

const COOL_COLORS = [
  "#FFF4E7",
  "#DAF1D5",
  "#F3F8CE",
  "#A7CBE2",
  "#F7C9D1",
  "#E6DFF7",
  "#F7E1E6",
  "#FFFEE3",
  "#E6DFF7",
  "#9AD5BF",
  "#F5D372",
  "#D4F4F6",
  "#C2E5C3",
  "#DAEDDE",
  "#F3F8CE",
];

const getRandomColor = (): string => {
  return COOL_COLORS[Math.floor(Math.random() * COOL_COLORS.length)];
};

function App() {
  const [bgColor, setBgColor] = useState(getRandomColor());

  const [emoji, setEmoji] = useState(getRandomEmoji());

  const downloadRef = useRef(null) as MutableRefObject<null>;

  const handleDownloadImage = async () => {
    exportComponentAsPNG(downloadRef);
  };

  return (
    <div className="shadow-lg mt-8 p-8 bg-slate-50 max-w-6xl ml-auto mr-auto">
      <h1 className="text-4xl font-bold">Emoji to PNG</h1>

      <div className="flex justify-between mt-6">
        <div>
          <label className="font-bold">Emoji:</label>
          <input
            type="text"
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            size={1}
            maxLength={1}
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

          <br />
          <br />

          <button
            type="button"
            onClick={handleDownloadImage}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Download PNG
          </button>
        </div>
        <div>
          <div
            ref={downloadRef}
            className="w-[600px] h-[600px] flex items-center justify-center"
            style={{
              backgroundColor: bgColor,
            }}
          >
            <span className="text-emoji">{emoji}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
