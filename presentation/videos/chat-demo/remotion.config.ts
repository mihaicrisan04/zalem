import { Config } from "@remotion/cli/config";

// Transparent webm output (alpha channel preserved).
Config.setVideoImageFormat("png");
Config.setPixelFormat("yuva420p");
Config.setCodec("vp9");
