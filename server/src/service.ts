import { Express } from 'express';
import ClientOAuth2 from 'client-oauth2';
import request from 'request'
import { User, Options, Auth } from './database';

abstract class Service {

	abstract createOAuth(): ClientOAuth2 | undefined;

	abstract name(): string;

	abstract async posts(count: number): Promise<any[]>;

	async request(url: string, method: string = 'GET'): Promise<any> {
		const values: any = { method, url };
		const user = await User.getUser();

		if(user) {

			const auths = await user.getAuths();
			const auth = auths.find(a => a.service === this.name());
			if(auth) {

				const oauth = this.createOAuth();
				if(!oauth) return null;

				let token = oauth.createToken(auth.accessToken, auth.refreshToken, {});
		 
				//const refreshed = await token.refresh();

				values.headers = {
					'Authorization': `bearer ${auth.accessToken}`,
					'User-Agent': 'FeedMe',
				};


				return new Promise((resolve, reject) => {
					request(values, (error, response, body) => {
						if(error) reject(`Error: ${error}`);
						resolve(body);
					});
				});

			}

		}

		return null;

	}

	register(app: Express) {

		const name = this.name();
		const oauth = this.createOAuth();

		if(oauth) {

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

}

export default Service;