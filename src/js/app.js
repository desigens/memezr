(function() {

	var DEFAULT = window.memeJson;

	String.prototype.hashCode = function() {
	    var hash = 0,
	        i, chr, len;
	    if (this.length == 0) return hash;
	    for (i = 0, len = this.length; i < len; i++) {
	        chr = this.charCodeAt(i);
	        hash = ((hash << 5) - hash) + chr;
	        hash |= 0; // Convert to 32bit integer
	    }
	    return hash;
	};

	// Main meme model
    var Meme = Backbone.Model.extend({

        defaults: {
        	edit: true,
            imageUrl: undefined,
            texts: [] // Collection
        },

        toggleEdit: function () {
    		this.set('edit', !this.get('edit'));
    	}

    });

    // Text bubble model
    var Text = Backbone.Model.extend({

    	defaults: {
    		text: '',
    		left: 0,
    		top: 0,
    		color: '#fff',
    		size: 36,
    		fontFamily: 'Impact',
    		textAlign: 'center'
    	},

    	initialize: function () {
    		this.on('change add', function () {
    			this.save();
    		});
    	}

    });

	// Collection of texts on meme
    var Texts = Backbone.Collection.extend({

        model: Text,

        localStorage: new Backbone.LocalStorage("KarlMeme"),

        initialize: function () {

        	this.fetch();

        	if (this.length === 0) {

        		this.add(DEFAULT.texts);

        	}

        }

    });

	// Main meme view
    var MemeView = Backbone.View.extend({

    	events: {
    		'click': 'toggleEdit',
    		'dblclick': 'add',
    		'click .add': 'add'
    	},

        initialize: function() {

            // Canvas
            this.canvas = document.createElement("canvas");

            // TODO test: is it better?
            this.canvas.style.webkitFontSmoothing = "antialiased";

            // Canvas context
            this.ctx = this.canvas.getContext('2d');

            // Put on page
            this.el.appendChild(this.canvas);

            // Load background image
            this.image = new Image();
            this.image.onload = _.bind(this.render, this);
            this.image.src = this.model.get('imageUrl');

			// For downloading
            this.image.crossOrigin = 'anonymous';

            // Child view with texts for editing
            var texts = new TextsView({
            	model: this.model,
            	collection: this.model.get('texts')
            });
            this.el.appendChild(texts.el);

            // Add bubble button
            var add = document.createElement('i');
            add.className = 'add';
            add.innerHTML = '+';
            this.el.appendChild(add);

			// Edit mode
            this.listenTo(this.model, 'change:edit', this.render);
        },

        render: function () {

			// Size by backgroud image
        	this.canvas.width = this.image.width;
        	this.canvas.height = this.image.height;
        	this.el.style.width = this.image.width + 'px';

        	// Background image
        	this.ctx.drawImage(this.image, 0, 0);

        	// Render texts on canvas
        	if (!this.model.get('edit')) {
        		this.model.get('texts').forEach(this.renderTexts, 
        			this);
        	}

        	this.el.className = this.model.get('edit') ? 'edit' : '';

        },

        renderTexts: function (textModel) {

        	// Common settings
    		this.ctx.textBaseline = 'hanging';

    		// This align is equal in apps's target browsers
    		// see http://canvas-text.googlecode.com/svn/trunk/examples/textposition.html
    		this.ctx.textBaseline = 'alphabetic';

		    this.ctx.shadowBlur = 20;
		    this.ctx.shadowColor = "black";

    		// Text block style
    		this.ctx.font = textModel.get('size') + 'px ' +
    			textModel.get('fontFamily');
		    this.ctx.fillStyle = textModel.get('color');
		    this.ctx.textAlign = textModel.get('textAlign');

			// Start X text on canvas
		    var caret = {
				'left': 0 + 10,
				'center': this.image.width / 2,
				'right': this.image.width - 10
			};
    		
    		// Multiline text support
    		wrapText(this.ctx, textModel.get('text'),
    			caret[textModel.get('textAlign')], 
    			textModel.get('top'), this.image.width - 10 - 10, 
    			textModel.get('size'));

        },

        toggleEdit: function (e) {
			e.stopPropagation();
			// this.model.toggleEdit();
			this.model.set('edit', true);
        },

        add: function (e) {
        	this.model.get('texts').add({
        		text: 'hello',
        		top: e.offsetY
        	});
        }

    });

	// Collection of Views
	var TextsView = Backbone.View.extend({

		className: 'bubbles',

		initialize: function() {
			
			this.listenTo(this.collection, 'change', function () {
				//TODO add, remove
			});

			this.listenTo(this.collection, 'add', this.add);

			this.fill();
			this.render();

		},

		fill: function() {

			var els = [];

			this.collection.forEach(function(textModel) {
	        	var view = new TextView({
	        		model: textModel
	        	});
	        	els.push(view.el);
        	});

			this.$el.append(els);			
		},

		add: function (textModel) {
			var view = new TextView({
        		model: textModel
        	});
			this.$el.append(view.el);
		}

	});

	var TextView = Backbone.View.extend({

		className: 'text',

		template: _.template($('#template').html(), null,
			{variable: 'data'}),

		events: {
			'keydown': 'update',
			'keyup': 'update',
			'click': 'stopPropagation',
			'dblclick': 'stopPropagation',
			'click .plus': 'plus',
			'click .minus': 'minus',
			'click .left': 'left',
			'click .center': 'center',
			'click .right': 'right',
			'click .remove': 'destroy',
			'change select': 'fontFamily'
		},

		initialize: function () {

			_.bindAll(this, 'update');

			this.render();

			this.$el.draggable({ 
		    	handle: ".handler",
		    	axis: "y",
		    	containment: "parent",
		    	stop: _.bind(function(e, obj) {
		    		this.model.set('top', obj.position.top);
		    	}, this)
			});

			this.listenTo(this.model, 'change:textAlign change:size change:fontFamily', this.render);

			this.listenTo(this.model, 'destroy', function () {
				this.remove();
			});

		}, 

		update: function (e) {

			if (e.keyCode === 13) {
				// insert 2 br tags (if only one br tag is inserted 
				// the cursor won't go to the next line)
				document.execCommand('insertHTML', false, '');
				// prevent the default behaviour of return key pressed
				e.preventDefault();
		    }
		    this.model.set('text', this.$el.find('div').text().trim());
		},

		stopPropagation: function (e) {
			e.stopPropagation();
		},

		render: function () {

			this.$el.css({
				position: 'absolute',
				top: this.model.get('top'),
				color: this.model.get('color'),
				fontSize: this.model.get('size'),
				fontFamily: this.model.get('fontFamily'),
				lineHeight: this.model.get('size') + 'px',
				textAlign: this.model.get('textAlign')
			});

			this.$el.html(this.template({
				text: this.model.get('text'),
				fontFamily: this.model.get('fontFamily'),
				textAlign: this.model.get('textAlign'),
			}));
		},

		plus: function () {
			this.model.set('size', this.model.get('size') + 1);
		},

		minus: function () {
			this.model.set('size', this.model.get('size') - 1);
		},

		left: function () {
			this.model.set('textAlign', 'left');
		},

		center: function () {
			this.model.set('textAlign', 'center');
		},

		right: function () {
			this.model.set('textAlign', 'right');
		},

		fontFamily: function (e) {
			this.model.set('fontFamily', $(e.target).find(':selected').text());
		},

		destroy: function () {
			this.model.destroy();
		}

	});

	// Draw multiline text on canvas
    function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
	    var words = text.split(' ');
	    var line = '';
	    for (var n = 0; n < words.length; n++) {
	        var testLine = line + words[n] + ' ';
	        var metrics = ctx.measureText(testLine);
	        var testWidth = metrics.width;
	        if (testWidth > maxWidth && n > 0) {
	            ctx.fillText(line, x, y);
	            line = words[n] + ' ';
	            y += lineHeight;
	        } else {
	            line = testLine;
	        }
	    }
	    ctx.fillText(line, x, y);
	}

	var DownloadView = Backbone.View.extend({

		events: {
			'click': 'download'
		},

		initialize: function (args) {
			this.canvas = args.canvas;
			this.button = this.$el.find('a')[0];
			this.listenTo(this.model, 'change:edit', this.render);
			this.render();
		},

		render: function () {
			if (this.model.get('edit')) {
				this.$el.hide();
			} else {
				this.$el.show();
			}
		},

		download: function () {
			var dataURL = this.canvas.toDataURL('image/jpeg');
	    	this.button.href = dataURL;
	    	this.button.download = 'carl' + JSON.stringify(this.model.attributes).hashCode() + '.jpg';
		}

	});

	var DoneView = Backbone.View.extend({

		events: {
			'click': 'done'
		},

		initialize: function (args) {
			this.listenTo(this.model, 'change:edit', this.render);
			this.render();
		},

		render: function () {
			if (this.model.get('edit')) {
				this.$el.show();
			} else {
				this.$el.hide();
			}
		},
		done: function () {
			this.model.toggleEdit();
		}
	});

	// Init it!

    var meme = new Meme({
    	imageUrl: DEFAULT.image,
    	texts: new Texts(DEFAULT.texts)
    });

    var view = new MemeView({
        model: meme,
        el: $('#container')
    });

    var download = new DownloadView({
    	model: meme,
    	canvas: view.canvas,
        el: $('#download')
    });

    var done = new DoneView({
    	model: meme,
        el: $('#done')
    });

//TODO stopPropagation when draggable.stop
  //   $('body').on('click', function (e) {
		// meme.set('edit', false);	
  //   });

    window.app = {
    	meme: meme,
    	view: view,
    	download: download,
    	done: done
    }

}());