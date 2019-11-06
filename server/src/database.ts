import Sequelize from 'sequelize';
import { Association, HasOneGetAssociationMixin, HasOneSetAssociationMixin, HasManyGetAssociationsMixin, HasManyCreateAssociationMixin, HasManySetAssociationsMixin } from 'sequelize';

const sequelize = new Sequelize.Sequelize({
	dialect: 'sqlite',
	storage: 'database.sqlite',
	logging: (s => {}),
});

sequelize
  .authenticate()
  .then(() => console.log('Connection has been established successfully.'))
  .catch(err => console.error('Unable to connect to the database:', err));

type service = string;
type token = string;
export class User extends Sequelize.Model {
	public id!: number;
	public username!: string;

	public getOptions!: HasOneGetAssociationMixin<Options>;
	public setOptions!: HasOneSetAssociationMixin<Options, number>;

	private createAuth!: HasManyCreateAssociationMixin<Auth>;
	public getAuths!: HasManyGetAssociationsMixin<Auth>;

	public static associations: {
		options: Association<User, Options>;
		auths: Association<User, Auth>;
	};

	static async createUser(values: {username: string}): Promise<User> {
		const { username } = values;

		const existing = await User.findOne({ where: { username } });
		if(existing) return existing;

		const user = await User.create(values);
		const options = await Options.create({ id: user.id })
		await user.setOptions(options);

		await user.save();
		return user;
	}

	static async getUser(): Promise<User | null> {
		return await User.findOne({ include: ['options', 'auths'] });
	}

	async authenticate(service: service, accessToken: token, refreshToken: token) {

		const auths = await this.getAuths();
		const existing = auths.filter(a => a.service == 'reddit');
		const values = { service, accessToken, refreshToken };

		if(existing.length)
			await existing[0].update(values);
		else
			await this.createAuth(values);

		await this.save();
	}

}

export class Options extends Sequelize.Model {
	public id!: number;

	public dark!: boolean;
}

export class Auth extends Sequelize.Model {
	public service!: service;
	public accessToken!: token;
	public refreshToken!: token;
}

Auth.init({
	service: {
		type: Sequelize.ENUM('reddit'),
		allowNull: false
	},
	accessToken: {
		type: Sequelize.STRING,
		allowNull: false,
	},
	refreshToken: {
		type: Sequelize.STRING,
		allowNull: false,
	}
},{
	sequelize,
	modelName: 'auth'
});

Options.init({
	dark: {
		type: Sequelize.BOOLEAN,
		defaultValue: false,
	}
},{
	sequelize,
	modelName: 'options'
});

User.init({
	username: {
		type: Sequelize.STRING,
		allowNull: false,
	}
},{
	sequelize,
	modelName: 'user'
});


User.hasOne(Options, { foreignKey: 'id', as: 'options'});
User.hasMany(Auth, { as: 'auths'});

/*
sequelize.sync({ force: true })
	.then(() => User.createUser({ username: 'Dev' }));
*/