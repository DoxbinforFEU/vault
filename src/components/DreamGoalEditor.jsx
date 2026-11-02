import { useState, useRef } from "react";
import { parseAmount } from "../lib/budget.js";
import Modal from "./Modal.jsx";

export default function DreamGoalEditor({ dreamGoal, symbol, onSave, onClose }) {
  const [name, setName] = useState(dreamGoal?.name || "");
  const [target, setTarget] = useState(dreamGoal ? (dreamGoal.target / 100).toString() : "");
  const [imageBase64, setImageBase64] = useState(dreamGoal?.imageBase64 || "");
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        // Create an off-screen canvas to resize and compress the image
        const canvas = document.createElement("canvas");
        const MAX_SIZE = 400;
        let width = img.width;
        let height = img.height;

        // Calculate aspect ratio
        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        // Compress heavily as webp (quality 0.5) to keep it under ~30kb for localStorage
        const compressedBase64 = canvas.toDataURL("image/webp", 0.5);
        setImageBase64(compressedBase64);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!name.trim() || !target || !imageBase64) return;
    onSave({
      name: name.trim(),
      target: parseAmount(target),
      imageBase64,
    });
  };

  return (
    <Modal title={dreamGoal ? "Edit Dream Goal" : "Set Dream Goal"} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Goal Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. New Laptop"
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-sapphire/40 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-50"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Target Amount</label>
          <div className="flex items-center rounded-xl border border-gray-200 bg-white px-3 dark:border-gray-700 dark:bg-gray-950">
            <span className="text-gray-400">{symbol}</span>
            <input
              type="text"
              inputMode="decimal"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="50000"
              className="w-full bg-transparent px-2 py-3 text-right font-mono text-lg font-semibold tabular-nums text-gray-900 focus:outline-none dark:text-gray-50"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Image</label>
          {imageBase64 ? (
            <div className="relative mb-2 aspect-video w-full overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
              <img src={imageBase64} alt="Preview" className="h-full w-full object-cover" />
              <button
                onClick={() => setImageBase64("")}
                className="absolute right-2 top-2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex aspect-video w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 text-gray-500 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900/50 dark:hover:bg-gray-800"
            >
              <span>+ Upload Image</span>
              <span className="mt-1 text-xs text-gray-400">Optimized for storage</span>
            </button>
          )}
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={!name.trim() || !target || !imageBase64}
          className="mt-4 w-full rounded-2xl bg-sapphire py-3.5 text-base font-semibold text-white active:scale-[0.99] disabled:opacity-50"
        >
          Save Goal
        </button>
      </div>
    </Modal>
  );
}
