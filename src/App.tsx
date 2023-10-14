import { useState } from "react";
import "./App.css";

function App() {
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

  const [bgColor, setBgColor] = useState(
    COOL_COLORS[Math.floor(Math.random() * COOL_COLORS.length)]
  );

  return (
    <div className="shadow-lg m-6 p-6 bg-slate-50">
      <h1 className="font-bold text-3xl">Emoji to PNG</h1>

      <div className="flex justify-between mt-6">
        <div>tweaks part</div>
        <div>
          <div
            className="w-[600px] h-[600px] flex items-center justify-center"
            style={{
              backgroundColor: bgColor,
            }}
          >
            <span className="text-emoji">🌴</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
