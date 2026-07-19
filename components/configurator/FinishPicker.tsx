"use client";

import { FINISH_LIST, formatPrice } from "@/lib/materials";
import type { FinishId } from "@/types/configurator";

interface FinishPickerProps {
  value: FinishId;
  onChange: (finish: FinishId) => void;
}

/** CSS approximations of each paint finish for the swatch chips */
const FINISH_SWATCH: Record<FinishId, string> = {
  gloss:
    "radial-gradient(circle at 32% 28%, #ffffff 0%, #9aa1ab 22%, #4b5563 70%)",
  matte: "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)",
  metallic:
    "linear-gradient(135deg, #d7dbe2 0%, #7c8593 35%, #aab2bd 55%, #5d6570 100%)",
  satin: "linear-gradient(135deg, #9aa1ab 0%, #6b7280 55%, #848b95 100%)",
  chrome:
    "linear-gradient(160deg, #ffffff 0%, #c9ced6 30%, #5d6570 50%, #e5e8ec 70%, #8b929c 100%)",
  carbon:
    "repeating-conic-gradient(#3d4249 0% 25%, #14161a 25% 50%) 0 0 / 6px 6px",
};

export function FinishPicker({ value, onChange }: FinishPickerProps) {
  return (
    <div className="grid grid-cols-2 gap-[7px]">
      {FINISH_LIST.map((finish) => {
        const active = value === finish.id;
        return (
          <button
            key={finish.id}
            onClick={() => onChange(finish.id)}
            title={finish.description}
            className={`flex items-center gap-2.5 rounded-[10px] border px-[10px] py-[5px] text-left text-[13px] font-semibold text-ink transition-colors ${
              active
                ? "border-accent bg-[var(--fill-active)]"
                : "border-line bg-transparent hover:bg-[var(--fill-hover)]"
            }`}
          >
            <span
              className="h-[18px] w-[18px] shrink-0 rounded-full"
              style={{
                background: FINISH_SWATCH[finish.id],
                boxShadow: "inset 0 0 0 1px var(--ring-inset)",
              }}
            />
            <span className="min-w-0 flex-1">
              {finish.name}
              <span className="mt-px block font-mono text-[9.5px] font-normal text-dim">
                {formatPrice(finish.price)} / part
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
