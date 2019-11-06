import { Express } from 'express';
import ClientOAuth2 from 'client-oauth2';
import { User, Auth } from './database';
import HTTPS from 'https'

import { User, Options, Auth } from './database';

abstract class Service {

	abstract createOAuth(): ClientOAuth2;

	abstract name(): string;

	abstract async posts(count: number): Promise<any>;

	async request(url: string, method: string = 'post'): Promise<any> {
		const values = { method, url };
		const user = await User.getUser();

		if(user) {

			const auths = await user.getAuths();
			const auth = auths.find(a => a.service === this.name());
			if(auth) {

				const oauth = this.createOAuth();
				const token = oauth.createToken(auth.accessToken, auth.refreshToken, {});
		 
				token.expiresIn(60 * 60);

				const req = token.sign(values);

				return new Promise((resolve, reject) => {
					const { url, method, headers } = req;
					HTTPS.request(url, { method, headers }, res => 
						res.on('data', data =>
							resolve(data.toString())))
					.on('error', e => resolve(e))
					.end();
				});

			}

		}

		return null;

	}

	register(app: Express) {

		const name = this.name();
		const oauth = this.createOAuth();

		app.get(`/register/${name}`, (req, res) => {
			const uri = oauth.code.getUri();
			res.json({uri});
		});

		app.get(`/callback/${name}`, async (req, res) => {

			let answer = await oauth.code.getToken(req.originalUrl);
			answer = await answer.refresh();

			const { accessToken, refreshToken } = answer;

			const user = await User.getUser();
			if(user) await user.authenticate(name, accessToken, refreshToken);

			res.json({ accessToken, refreshToken });

		});

	}

}

export default Service;