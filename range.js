module.exports = class Range() {
	constructer(items) {
		super(items)
		this.atEnd = false;
		this.atStart = false;
		this.items = items;
		this.length = items.length;
	}
	
	merge(range) {
			
	}
	
	clear(){
		this.atEnd = false;
		this.atStart = false;
		this.items = [];
		this.length = this.items.length;
	}
};