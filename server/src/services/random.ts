import express from 'express';
import Service from '../service';

const random = require('random-sentence');

class Random extends Service {

	createOAuth(): undefined {}

	name(): string {
		return 'random';
	}

	async posts(start: {[key: string]: string}, count: number, index = 0): Promise<any[]> {
		
		const posts = [];
		for(let i = 0; i < count; i++) {

			const id = + new Date() + i;
			const text = Math.random() < 0.2 ? undefined : random({min: 2, max: 100});
			let images = [];

			if(!text) {
				const rand = Math.floor(Math.random() * 600 + 200);
				images.push(`https://picsum.photos/${rand}`);
			}

			for(let i = 2; i <= 2; i++) if(Math.random() / i < 0.1) {
				const rand = Math.floor(Math.random() * 600 + 200);
				images.push(`https://picsum.photos/${rand}`);
			}

			images = images.map(i => { return {full: i}})

			posts.push({ text, images, id });

		}

		return posts;

	}

}

export default Random;