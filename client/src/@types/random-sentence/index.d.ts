/// <reference types="node" />

declare module 'random-sentence' {

	export default function random(params: {min?: number, max?: number, words?: number}): string;

}