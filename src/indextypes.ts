import { LinearIndex } from "@src/method/linearsearch";

// using any. fix it.
export const IndexTypes: { [key: string]: new (index?: any) => any } = {
    LinearIndex
};
