import React from 'react';
import './App.css';

type PostProps = {
	id: string,
	service: string,
	title?: string,
	text?: string,
	images?: string[],
}

class Post extends React.Component<{post: PostProps, app: App},{}> {

	render() {
		const { app, post } = this.props;
		const { text, images, title, service } = post;

		return (
			<div className='post' onClick={() => app.selectPost(post)}>
				<p className='service'>{service}</p>
				{title && <h1 className='title'>{title}</h1>}
				<div className='row'>
					{text && <p className='col' dangerouslySetInnerHTML={{__html: text}}></p>}
					{(images && images.length > 0) &&
						 <div className='col'>
							 <div className='row justify-content-end'>
								{images.map((image, i) => <div className='col'>
									<img onClick={() => app.selectPost(post, i)} key={i} alt={text} className={text ? '' : 'single'} src={image}></img>
								</div>)}
							</div>
						</div>
					}
				</div>
			</div>
		);
	}

}

type SliderProps = {images: {src: string, alt?: string}[], active: number};
class Slider extends React.Component<SliderProps,{active: number}> {

	constructor(props: SliderProps) {
		super(props);
		this.state = {active: props.active};
	}

	swipe(i: number) {
		const images = this.props.images;
		const active = Math.min(images.length - 1, Math.max(0, this.state.active + i));
		this.setState({ active });
	}

	render() {
		const { images } = this.props;
		const { active } = this.state;

		const multiple = images.length > 1;

		return (
			<div className='slider mb-3'>
			{(multiple && active > 0) && <div onClick={() => this.swipe(-1)} className='previous'></div>}
				{images.map((img, i) => {
					let s = '';
					if(active != i)  s += (active > i ? 'hidden-left' : 'hidden-right');
					return <img key={i} className={s} alt={img.alt} src={img.src}></img>
				})}
			{(multiple && active < images.length - 1) && <div onClick={() => this.swipe(+1)} className='next'></div>}
			</div>
		);
	}

}

class BigPost extends React.Component<{post: PostProps, active: number},{}> {

	render() {
		const { post, active } = this.props;
		const { text, images, title } = post;

		return (
			<div className='row justify-content-center m h-100'>
				<div className='col align-self-center'>
					{(images && images.length > 0) && <Slider active={active} images={images.map(i => { return {src: i, alt: title || text}})} />}
					{text && <p dangerouslySetInnerHTML={{__html: text}}></p>}
				</div>
			</div>
		);
	}

}

class Feed extends React.Component<{app: App},{posts: PostProps[], message?: string, loadingProcess: number, loading: boolean}> {

	total = 5;

	constructor(props: any) {
		super(props);
		this.state = {posts: [], loadingProcess: 0, loading: false};
	}

	fetchPosts(count = 20) {
		this.setState({ loading: true, loadingProcess: 0 })

		fetch(`/posts?count=${count}`)
			.then(res => res.json())
			.then(res => {

				if(Array.isArray(res)) {
					const posts = [...this.state.posts, ...res];
					this.setState({ posts, loading: false });
				} else {
					this.setState({ message: res.message });
				}

			});

	}

	componentDidMount() {
		this.fetchPosts();

		window.setInterval(() => {
			let { loadingProcess } = this.state;
			if(loadingProcess > 0) {
				loadingProcess--;
				this.setState({ loadingProcess })
			}
		}, 100);
	}

	scroll(e: React.WheelEvent) {
		let { loadingProcess } = this.state;
		loadingProcess++;

		if(e.deltaY > 0) {
			const scroll = e.currentTarget.scrollHeight - e.currentTarget.scrollTop;
			const height = e.currentTarget.getBoundingClientRect().height;
			if(scroll - height < 10) {
				if(loadingProcess > this.total)
					this.fetchPosts();
				else
					this.setState({ loadingProcess });
			}
		}
	}

	render() {
		const { posts, loadingProcess, loading, message } = this.state;
		const { app } = this.props;
		const showLoading = loadingProcess > 0 || loading;

		return (
			<div className='feed col-5' onWheel={e => this.scroll(e)}>
				{<h2 className='mt-2 mb-5 message'>{message ? message : "You've reached the top"}</h2>}
				{posts.map((post, i) => <Post key={i} post={post} app={app} />)}

				<div className={`loading ${showLoading ? '' : 'hidden'} ${loading ? 'process' : ''}`}></div>
			</div>
		);
	}

}

type Options = {
	dark: boolean,
}

type Auth = {
	service: string
}

type User = {
	username: string,
	options: Options,
	auths: Auth[],
}

class Profile extends React.Component<{user: User},{}> {

	render() {
		const { user } = this.props;

		return (
			<>
				<h1>Profile</h1>
				<p>{user.username}</p>
			</>
		);
	}

}

class Settings extends React.Component<{options: Options},{}> {

	registerService(service: string) {
		fetch(`/register/${service}`)
			.then(res => res.json())
			.then(json => {
				if(json.uri) window.open(json.uri, '_blank');
			});
	}

	render() {
		const { options } : any = this.props;

		const services = ['reddit'];

		return (
			<>
				<h1>Settings</h1>
				{Object.keys(options).filter(k => typeof options[k] === 'boolean').map(k => <p key={k}>{k}: {options[k].toString()}</p>)}
				{services.map(service =>
					<button className={`service ${service}`} onClick={() => this.registerService(service)} key={service}>{service}</button>
				)}
			</>
		);
	}

}
type Screen = { element: JSX.Element, key: string };
type Screens = ({ icon: string } & Screen)[]

class Sidebar extends React.Component<{screen?: Screen, last?: Screen, buttons: Screens, app: App},{}> {

	constructor(props: any) {
		super(props);
		this.state = {};
	}

	render() {
		const { screen, buttons, app, last } = this.props;

		return (
			<div className='sidebar col row'>
				<SidebarButtons screens={buttons} minimized={screen !== undefined} sidebar={app} />
				{screen && <div id={screen.key} key={screen.key} className='screen'>{screen.element}</div>}
				{last && <div id={last.key} key={`${last.key}-last`} className='screen last'>{last.element}</div>}
			</div>
		);
	}

}

class SidebarButtons extends React.Component<{sidebar: App, minimized: boolean, screens: Screens},{}> {

	render() {
		const { sidebar, minimized, screens } = this.props;

		return (
			<div onClick={() => { if(minimized) sidebar.select(); }} className={`buttons ${minimized ? 'minimized' : ''}`}>
				{screens.map((screen) => <button onClick={() => sidebar.select(screen)} key={screen.key} >{screen.icon}</button>)}
			</div>
		);
	}

}

class App extends React.Component<{},{user?: User, screen?: Screen, last?: Screen}> {

	constructor(props: any) {
		super(props);
		this.state = {};
	}

	select(screen?: Screen) {
		const last = this.state.screen;
		if(!last || !screen || last.key !== screen.key)
			this.setState({ screen, last });
	}

	selectPost(post: PostProps, image = 0) {
		this.select({element: <BigPost post={post} active={image} />, key: post.id});
	}

	getUser() {
		fetch('/user')
			.then(res => res.json())
			.then(user => this.setState({ user }));
	}

	componentDidMount() {
		this.getUser();
	}

	render() {
		const { user, last, screen } = this.state;

		const buttons: Screens = [];

		if(user) {
			buttons.push({key: 'options', icon: '⚙', element: <Settings options={user.options} />});
			buttons.push({key: 'profile', icon: '🧙‍♂️', element: <Profile user={user} />});
		}

		buttons.push({key: 'lit', icon: '🔥', element: <h1>🔥🔥🔥</h1>});
		buttons.push({key: 'fam', icon: '💯', element: <h1>Lit Fam</h1>});

		if(user)
			return (
				<div className={`app row m-0 ${user.options.dark ? 'dark' : ''}`}>
					<Feed app={this} />
					<Sidebar app={this} screen={screen} last={last} buttons={buttons} />
				</div>
			);

		return <h1>Log in you moron</h1>
	}
}

export default App;
