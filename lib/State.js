import jsonop from 'jsonop';

export default class State {
	constructor (options) {
		this.data = {};
		this._options = options;
		this._watches = {};
	}

	put (changes) {
		jsonop(this.data, changes, this._options.op);

		function fire(data, change, watch) {
			if (watch._cb_) { watch._cb_.forEach(fn => fn(data)); }

			for (let prop in change) {
				if (!watch[prop] || prop[0] === '_') { continue; }
				fire(data[prop], change[prop], watch[prop]);
			}
		}

		fire(this.data, changes, this._watches);
	}

	get (path) {
		let val = this.data;

		for (let prop of path) {
			val = val[prop];
			if (typeof val !== 'object' || val === null) { return val; }
		}

		return val;
	}

	watch (path, callback) {
		let point = this._watches;

		if (!callback) { throw Error('ERR_WATCH_NO_CALLBACK'); }

		for (let prop of path) {
			if (!point[prop]) { point[prop] = {}; }
			point = point[prop];
		}

		if (!point._cb_) { point._cb_ = []; }
		point._cb_.push(callback);

		callback(this.get(path));


		function cleanup () {
			// TODO: do this.
		}

		return () => {
			point._cb_.splice(point._cb_.indexOf(callback), 1);
			if (point._cb_.length === 0) {
				delete point._cb_;
				cleanup();
			}
		};
	}
}
