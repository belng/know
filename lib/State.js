/* @flow */

import jsonop from 'jsonop';

export default class State {
	_subscriptions: { [key: string]: Array<Function> } = {};
	_data: { [key: string]: any } = {};
	_options: { op: Object };

	constructor(options: { op: Object }) {
		this._options = options;
	}

	get(key: string): any {
		return this._data[key];
	}

	set(key: string, value: any) {
		if (this._data[key] === value) {
			return;
		}

		const old = this._data;
		const data = this._data = { ...old };

		if (typeof data[key] === 'object' && data[key] !== null) {
			data[key] = jsonop({ ...data[key] }, value, this._options);
		} else {
			data[key] = value;
		}

		const subscriptions = this._subscriptions[key];

		if (subscriptions) {
			for (let i = 0, l = subscriptions.length; i < l; i++) {
				subscriptions[i](data[key]);
			}
		}
	}

	put(changes: Object) {
		for (const key in changes) {
			this.set(key, changes[key]);
		}
	}

	watch(key: string, callback: Function): Function {
		callback(this.get(key));

		if (!this._subscriptions[key]) {
			this._subscriptions[key] = [];
		}

		const subscriptions = this._subscriptions[key];

		subscriptions.push(callback);

		return () => {
			const index = subscriptions.indexOf(callback);

			if (index !== -1) {
				subscriptions.splice(index, 1);
			}
		};
	}
}
