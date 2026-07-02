import { Composition } from "remotion";
import { ContextDemo } from "./ContextDemo";

export const RemotionRoot = () => {
  return (
    <Composition
      id="ContextDemo"
      component={ContextDemo}
      durationInFrames={360}
      fps={30}
      width={1120}
      height={620}
    />
  );
};
