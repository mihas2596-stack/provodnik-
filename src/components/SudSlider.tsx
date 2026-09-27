import { useState } from "react";

/** Слайдер 0–10: крупные деления, подписи только у краёв, без цвета и смайлов. */
export function SudSlider({
  label,
  onSubmit,
}: {
  label: string;
  onSubmit: (value: number) => void;
}) {
  const [value, setValue] = useState(5);

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(value);
      }}
    >
      <label className="block text-lg" htmlFor="sud">
        {label}
      </label>
      <div className="space-y-3">
        <input
          id="sud"
          type="range"
          min={0}
          max={10}
          step={1}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          aria-valuetext={`${value} из 10`}
          className="h-3 w-full appearance-none rounded-full bg-secondary accent-primary"
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>0 — спокойно</span>
          <span aria-hidden="true" className="text-2xl text-foreground">
            {value}
          </span>
          <span>10 — максимум</span>
        </div>
      </div>
      <button type="submit" className="btn-base btn-primary w-full">
        Дальше
      </button>
    </form>
  );
}
