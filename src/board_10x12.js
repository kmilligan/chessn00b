/**
* Base classes for our board, square, etc.
* This version represents the board with a 10x12 single-dim array.
*
*@author Kurt Milligan
*/

// access point
var BoardFactory;

// scope wrapper
(function() 
{
	"use strict";

	/**
	* This helps us with inheritence, and not all browsers have it yet.
	*@see http://javascript.crockford.com/prototypal.html
	*/
	if(typeof Object.create !== 'function')
	{
		Object.create = function (o)
		{
			function F() {};
			F.prototype = o;
			return new F();
		};
	}	

	// Map of pieces to unicode characters
	var PieceMap =
	{
		'R': '\u2656',
		'N': '\u2658',
		'B': '\u2657',
		'Q': '\u2655',
		'K': '\u2654',
		'P': '\u2659',
		'r': '\u265c',
		'n': '\u265e',
		'b': '\u265d',
		'q': '\u265b',
		'k': '\u265a',
		'p': '\u265f'
	};

	PieceMap.isWhite = function(piece)
	{
		return(piece.charCodeAt(0) < 91?true:false);
	};

	PieceMap.getColor = function(piece)
	{
		return (this.isWhite(piece)?ColorMap.white:ColorMap.black);
	};

	// Map file numbers to letter names
	// and vice versa
	var FileMap =
	{
		'1': 'a',
		'2': 'b',
		'3': 'c',
		'4': 'd',
		'5': 'e',
		'6': 'f',
		'7': 'g',
		'8': 'h',
		'a': '1',
		'b': '2',
		'c': '3',
		'd': '4',
		'e': '5',
		'f': '6',
		'g': '7',
		'h': '8'
	};

	FileMap.name = function(file, rank)
	{
		return FileMap[file] + rank; 
	};

	FileMap.coords = function(name)
	{
		return { 	
				file: parseInt(FileMap[name.substr(0,1)],10), 
				rank: parseInt(name.substr(1,1),10)
			};
	};

	// color names
	var ColorMap = 
	{
		white: 8,
		black: 0 
	};

	/**
	* Object representing the chess board itself;
	* contains Squares, and various helper fn's to set the state
	*/
	var Board = {};	
	Board.init = function()
	{
		this.colorToMove = ColorMap.white;
		this.castlingOptions = '-';
		this.enpassantTarget = '-';
		this.halfMoveClock = 0;
		this.fullMoveNumber = 0;

		this.squares = [
-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,
-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,
-1, 0, 0, 0, 0, 0, 0, 0, 0,-1,
-1, 0, 0, 0, 0, 0, 0, 0, 0,-1,
-1, 0, 0, 0, 0, 0, 0, 0, 0,-1,
-1, 0, 0, 0, 0, 0, 0, 0, 0,-1,
-1, 0, 0, 0, 0, 0, 0, 0, 0,-1,
-1, 0, 0, 0, 0, 0, 0, 0, 0,-1,
-1, 0, 0, 0, 0, 0, 0, 0, 0,-1,
-1, 0, 0, 0, 0, 0, 0, 0, 0,-1,
-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,
-1,-1,-1,-1,-1,-1,-1,-1,-1,-1
						];

		this.squareColors = [
-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,
-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,
-1, 8, 0, 8, 0, 8, 0, 8, 0,-1,
-1, 0, 8, 0, 8, 0, 8, 0, 8,-1,
-1, 8, 0, 8, 0, 8, 0, 8, 0,-1,
-1, 0, 8, 0, 8, 0, 8, 0, 8,-1,
-1, 8, 0, 8, 0, 8, 0, 8, 0,-1,
-1, 0, 8, 0, 8, 0, 8, 0, 8,-1,
-1, 8, 0, 8, 0, 8, 0, 8, 0,-1,
-1, 0, 8, 0, 8, 0, 8, 0, 8,-1,
-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,
-1,-1,-1,-1,-1,-1,-1,-1,-1,-1
						];

		return this;
	};

	Board.setFEN = function(fen)
	{
		var parts = fen.split(' ');

		// setup the pieces
		var ranks = parts[0].split('/');
		for(var rank = 8; rank > 0; rank--)
		{
			this.setRankFEN(rank, ranks[8 - rank]);	
		}

		// setup the state
		this.colorToMove = (parts[1] == 'w'?ColorMap.white:ColorMap.black);
		if(parts[2])
			this.castlingOptions = parts[2];
		
		if(parts[3])
			this.enpassantTarget = parts[3];

		if(typeof parts[4] != 'undefined')
			this.halfMoveClock = parseInt(parts[4], 10);

		if(typeof parts[5] != 'undefined')
			this.fullMoveNumber = parseInt(parts[5], 10);
	};

	Board.setRankFEN = function(rank, fen)
	{
		var sqs = fen.split('');
		var file = 1;
		for(var idx in sqs)
		{
			// may have reached the end
			if(file > 8 || sqs[idx] == ' ')
				break;

			if(PieceMap[sqs[idx]])
			{
				this.setPiece(sqs[idx], file, rank);
				file++;
			}
			else
			{
				// numeric. spaces.
				while(sqs[idx] > 0)
				{
					this.removePiece(file, rank);
					sqs[idx]--;
					file++;
				}
			}
		}
	};

	Board.getColorToMove = function()
	{
		return this.colorToMove;
	};

	Board.incrementMove = function()
	{
		if(this.colorToMove == ColorMap.white)
		{
			this.colorToMove = ColorMap.black;
		}
		else
		{
			this.colorToMove = ColorMap.white;
			this.fullMoveNumber++;
		}
	};

	// get our internal array position
	Board.ap = function(file, rank)
	{
		return ((10 - parseInt(rank,10)) * 10) + parseInt(file,10);
	};

	// translate ap to notation
	Board.apToName = function(ap)
	{
		var file = ap % 10;
		var rank = 10 - Math.floor(ap / 10);

		return FileMap.name(file, rank);
	};

	Board.setPiece = function(piece, file, rank)
	{
		this.squares[this.ap(file, rank)] = piece;
	};
	
	Board.removePiece = function(file, rank)
	{
		this.squares[this.ap(file, rank)] = 0;
	};

	Board.hasPiece = function(file, rank)
	{
		var ap;
		if(typeof rank === 'undefined')
			ap = file;
		else
			ap = this.ap(file, rank);

		return (typeof this.squares[ap] === 'string'?true:false);
	};

	Board.getPiece = function(file, rank)
	{
		return this.squares[this.ap(file, rank)]; 
	};

	Board.getSquareColor = function(file, rank)
	{
		// might have given us algebraic
		if(typeof rank == 'undefined'
			&& typeof file == 'string')
		{
			rank = file.substr(1,1);
			file = FileMap[file.substr(0,1)];
		}
		//console.log(file + ',' + rank + ':' + this.ap(file, rank));
		return this.squareColors[this.ap(file, rank)];
	};

	Board.getCoveredSquares = function(file, rank)
	{
		var result = [];
		var diag = [];

		switch(this.getPiece(file, rank))
		{
			case 'K':
			case 'k':
				result = this.getStraightOptions(file,rank,1);
				diag = this.getDiagonalOptions(file,rank,1);
			break;
			case 'Q':
			case 'q':
				result = this.getStraightOptions(file,rank,8);
				diag = this.getDiagonalOptions(file,rank,8);
			break;
			case 'R':
			case 'r':
				result = this.getStraightOptions(file,rank,8);
			break;
			case 'B':
			case 'b':
				diag = this.getDiagonalOptions(file,rank,8);
			break;
			case 'N':
			case 'n':
				result = this.getKnightOptions(file,rank);
			break;
			case 'P':
			case 'p':
				result = this.getPawnOptions(file,rank);
			break;
			default:
				// nothing to do
			break;
		}

		// tack on the diag
		for(var i = 0; i < diag.length; i++)
			result.push(diag[i]);

		return result;
	};

	Board.getStraightOptions = function(file,rank,limit)
	{
		var options = [];
		var directions = [-1,-10,1,10];
		var dist, direction;
		var oap = this.ap(file,rank);
		var cap; // current array position
		for(var i = 0; i < directions.length; i++)
		{
			direction = directions[i];
			cap = oap;
			dist = 0;
			while(dist < limit)
			{
				cap += direction;

				// off the edge?
				if(this.squares[cap] < 0)
					break;

				// add it to the list
				options.push(this.apToName(cap));

				// have a piece?
				if(this.hasPiece(cap))
					break;

				dist++;
			}
		}

		return options;
	};

	Board.getDiagonalOptions = function(file,rank,limit)
	{
		var options = [];
		var directions = [-11,-9,9,11];
		var dist, direction;
		var oap = this.ap(file,rank);
		var cap; // current array position
		for(var i = 0; i < directions.length; i++)
		{
			direction = directions[i];
			cap = oap;
			dist = 0;
			while(dist < limit)
			{
				cap += direction;

				// off the edge?
				if(this.squares[cap] < 0)
					break;

				// add it to the list
				options.push(this.apToName(cap));

				// have a piece?
				if(this.hasPiece(cap))
					break;

				dist++;
			}
		}

		return options;
	};

	Board.getKnightOptions = function(file,rank)
	{
		var options = [];
		var directions = [-21,-19,-8,12,21,19,8,-12];
		var direction;
		var oap = this.ap(file,rank);
		var cap; // current array position
		for(var i = 0; i < directions.length; i++)
		{
			direction = directions[i];
			cap = oap + direction;

			// off the edge?
			if(this.squares[cap] < 0)
				continue;

			// add it to the list
			options.push(this.apToName(cap));
		}

		return options;
	};

	Board.getPawnOptions = function(file,rank)
	{
		var options = [];
		if(PieceMap.isWhite(this.getPiece(file, rank)))
			var directions = [-11,-9];
		else
			var directions = [11,9];
		
		var direction;
		var oap = this.ap(file,rank);
		var cap; // current array position
		for(var i = 0; i < directions.length; i++)
		{
			direction = directions[i];
			cap = oap + direction;

			// off the edge?
			if(this.squares[cap] < 0)
				continue;

			// add it to the list
			options.push(this.apToName(cap));
		}

		return options;
	};

	Board.dump = function()
	{
		var divider = '-----------------';
		console.log(divider);
		for(var r = 8; r > 0; r--)
		{
			var rankOut = '|';
			for(var f = 1; f < 9; f++)
			{
				if(!this.hasPiece(f,r))
					rankOut += ' ';
				else
					rankOut += this.getPiece(f,r);

				rankOut += '|';
			}
			console.log(rankOut);
			console.log(divider);
		}
	}

	// create a new board, provide access to some helpers
	BoardFactory = (function()
	{
		var that = {};
		
		that.create = function()
		{
			return Object.create(Board).init();
		};

		that.getPieceMap = function()
		{
			return PieceMap;
		};

		that.getFileMap = function()
		{
			return FileMap;
		};

		that.getColorMap = function()
		{
			return ColorMap;
		};

		return that;
	})();
})();
