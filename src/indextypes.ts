import { LinearIndex } from "@src/method/linearsearch";

// using any. fix it.
// biome-ignore lint: cannot typing, so using any.
export const IndexTypes: { [key: string]: new (index?: any) => any } = {
    LinearIndex,
};
