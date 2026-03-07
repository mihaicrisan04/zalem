// @ts-nocheck
"use client"

import * as React from "react"

import { cn } from "@zalem/ui/lib/utils"

function Label({
  className = "",
  ...props
}: any) {
  return (
    <label
      data-slot="label"
      className={cn(
        "gap-2 text-xs/relaxed leading-none font-medium group-data-[disabled=true]:opacity-50 peer-disabled:opacity-50 flex items-center select-none group-data-[disabled=true]:pointer-events-none peer-disabled:cursor-not-allowed",
        className
      )}
      {...props} />
  );
}


Label.displayName = "Label";

export { Label }

