import express from 'express';
import Reddit from './services/reddit';
import Random from './services/random';
import Twitter from './services/twitter';
import Service from './service';
import { User, Options, Auth } from './database';
const bodyParser = require('body-parser')
const path = require('path');

const app = express();
app.use(express.static(path.join(__dirname, 'build')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

class ServiceController {

	services: Service[];

	constructor(services: Service[]) {
		this.services = services;
	}

	register(App: express.Express): ServiceController {
		this.services.forEach(s => s.register(app));
		return this;
	}

	async filterFor(user: User): Promise<Service[]> {
		const auths = await user.getAuths();
		return this.services.filter(s => !s.createOAuth() || (auths && auths.find(a => a.service == s.name())));
	}

	/**
		Retrieves posts from the given services

		@param {number} total: The amount of posts to retrieve
		@param {Object} start: an object containing the last posts id retrieved from each service
		@param {Object} index: an object the current amount of posts retrieved from each service

		@return {Post[]} an array of posts
	*/
	async retrieve(user: User, total: number, start: {[key: string]: string}, index: {[key: string]: number}): Promise<Post[]> {

		const services = await this.filterFor(user);

		if(services.length <= 1) return [];

		const posts: any[] = [];
		const count = Math.ceil(total / services.length);

		for(let service of services) {

			try {

				const fetched = await service.posts(start[service.name()], count, index[service.name()]);

				fetched.forEach((post, i) => {
					post.index = i;
					post.service = service.name();
					posts.push(post);
				})
			
			} catch(e) {
				return [];
				console.log(`Caught Error with '${service.name()}: ${e}`)
			}

		}

		return posts.sort((a, b) => a.index - b.index);
	}

	getData(posts: Post[]): any {
		const last: {[key: string]: string} = {};
		const index: {[key: string]: number} = {};

		this.services.forEach(s => {
			const forService: Post[] = posts.filter(p => p.service == s.name());

			if(forService.length) 
				last[s.name()] = forService[forService.length - 1].id;
			index[s.name()] = forService.length;

		});

		const data: any = { last, index };
		Object.keys(data).forEach(k => {
			data[k] = JSON.stringify(data[k]);
		});
		return data;
	}

}

const Services = new ServiceController([
		new Reddit(),
		new Random()
	])
	.register(app);

/**
	API endpoint
	@return {Object} The currently logged in user as JSON
*/
app.get('/user', async (req, res) => {
	try {

		/* Request the user from the database */
		const user = await User.getUser();
		if(user)
			res.json(user);
		else res.send('Not Found');
	
	} catch(e) { res.send('Error') }
})

/*
	What the server excepts a Post to have 
*/
type Post = {
	id: string,
	service: string,
	sub?: string,
};

/**
	API endpoint
	Retrieves a specified amount of posts for the logged in user;
	@return {Object} The posts and request data
*/
app.get('/posts', async (req, res) => {

	const user = await User.getUser();
	if(user) {

		/* Query Data */
		const total: number = req.query.count || 1;
		const last: {[key: string]: string} = JSON.parse(req.query.last || '{}');
		const index: {[key: string]: number} = JSON.parse(req.query.index || '{}');

		const posts: Post[] = await Services.retrieve(user, total, last, index);

		/* Updates the last & index Object used in the 'retrieve' method */
		const data = Services.getData(posts);

		/* Parse the data to be able to be send back */

		if(posts.length > 0)
			res.send({ data, posts });
		else
			res.send({ data, message: 'You have no registered services 😢' });

	}
	
	res.send({ message: 'You are not logged in' });

});

/**
	Sets a specific user option
	@return {boolean} success
*/
app.post('/settings', async (req, res) => {
	
	const user = await User.getUser();
	const option = req.body.option;
	const value = req.body.value;

	if(user && option !== undefined && value !== undefined) {

		const options = await user.getOptions();
		
		try {

			options.set(option, value);
			await options.save();
			res.send(true);

		} catch(e) {

			console.log(`Error when setting option: ${option} = ${value}`)
			res.send(false);
			
		}

	}

});


app.get('*', (req, res) => {
	res.send('Not found');
});

app.listen(process.env.PORT || 8080, () => console.log('Started Server'));