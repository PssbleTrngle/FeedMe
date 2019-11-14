import express from 'express';
import Reddit from './services/reddit';
import Random from './services/random';
import Twitter from './services/twitter';
import Service from './service';
const bodyParser = require('body-parser')
const path = require('path');
const app = express();
import { User, Options, Auth } from './database';

app.use(express.static(path.join(__dirname, 'build')));

/*
	The Possible Services 
*/
const Services: Service[] = [
	new Reddit(),
	/* new Twitter(), */
	new Random(),
];

/* Register all urls for the services */
Services.forEach(s => s.register(app));

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
	Retrieves posts from the given services

	@param {number} total: The amount of posts to retrieve
	@param {Object} start: an object containing the last posts id retrieved from each service
	@param {Object} index: an object the current amount of posts retrieved from each service

	@return {Post[]} an array of posts
*/
async function retrieve(services: Service[], total: number, start: Object, index: Object): Promise<Post[]> {
	const posts: any[] = [];
	if(services.length <= 1) return posts;

	for(let service of services) {

		try {

			const s = start[service];

			const fetched = await service.posts(s, Math.ceil(total / services.length), index[service]);

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

	return posts.sort((a, b) => a.index > b.index);
}

/**
	API endpoint
	Retrieves a specified amount of posts for the logged in user;
	@return {Object} The posts and request data
*/
app.get('/posts', async (req, res) => {

	/* Get the user and his registered Authentifications */
	const user = await User.getUser();
	const auths = user ? await user.getAuths() : undefined;

	/* Filter services to find only those which do not needing an authentification or are registered to the user */
	const services = Services.filter(s => !s.createOAuth() || (auths && auths.find(a => a.service == s.name())));

	/* Query Data */
	const total: number = req.query.count || 1;
	const last: {[key: string]: string} = JSON.parse(req.query.last || '{}');
	const index: {[key: string]: number} = JSON.parse(req.query.index || '{}');

	const posts: Post[] = await retrieve(services, total, last, index);

	/* Updates the last & index Object used in the 'retrieve' method */
	services.forEach(s => {
		const forService: Post[] = posts.filter(p => p.service == s.name());

		if(forService.length) 
			last[s] = forService[forService.length - 1].id;
		index[s] = forService.length;

	});

	/* Parse the data to be able to be send back */
	let data = { last, index };
	Object.keys(data).forEach(k => {
		data[k] = JSON.stringify(data[k]);
	});

	if(posts.length > 0)
		res.send({ data, posts });
	else
		res.send({ data, message: 'You have no registered services 😢' });


});

app.get('*', (req, res) => {
	res.send('Not found');
});

app.listen(process.env.PORT || 8080, () => console.log('Started Server'));