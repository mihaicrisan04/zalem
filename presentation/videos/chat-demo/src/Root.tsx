import { Composition } from "remotion";
import { ChatDemo } from "./ChatDemo";

export const RemotionRoot = () => {
  return (
    <Composition
      id="ChatDemo"
      component={ChatDemo}
      durationInFrames={420}
      fps={30}
      width={1120}
      height={620}
    />
  );
};
