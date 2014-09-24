//"use strict";

// access point
var BoardFactory;

// scope wrapper
(function() 
{
	"use strict";

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

	// Map file numbers to letter names
	var FileMap =
	{
		'1': 'a',
		'2': 'b',
		'3': 'c',
		'4': 'd',
		'5': 'e',
		'6': 'f',
		'7': 'g',
		'8': 'h'
	};

	/**
	* Object representing a specific, single square on the board.
	*/
	var Square = {};

	/**
	* Setup; determine our color, add click handlers
	*/
	Square.init = function(board, file, rank)
	{
		this.board = board;
		this.file = file;
		this.rank = rank;
		this.color = 0;
		this.name = FileMap[file] + rank; 
		this.piece = '';

		// figure out our color
		var fileEven = (file % 2 == 0);
		var fileOdd = !fileEven;
		var rankEven = (rank % 2 == 0);
		var rankOdd = !rankEven;
		if((fileOdd && rankEven)
			|| (fileEven && rankOdd))
			this.color = 1;
	
		return this;
	};

	Square.setPiece = function(piece)
	{
		if(PieceMap[piece] === 'undefined')
			throw new Error('Invalid piece');

		this.piece = piece;
	};

	Square.removePiece = function()
	{
		this.piece = '';
	};

	Square.hasPiece = function()
	{
		return (this.piece == ''?false:true);
	};

	Square.getPiece = function()
	{
		return this.piece;
	};

	Square.isWhite = function()
	{
		return (this.color == 1?true:false);
	};

	/**
	* Object representing the chess board itself;
	* contains Squares, and various helper fn's to set the state
	*/
	var Board = {};	
	Board.init = function()
	{
		this.colorToMove = 1;

		// initialize our Squares
		this.squares = [];
		for(var f = 1; f < 9; f++)
		{
			for(var r = 1; r < 9; r++)
			{
				// allocate our array
				if(r == 1)
					this.squares[f] = [];
				this.squares[f][r] = Object.create(Square).init(this, f, r);
			}
		}

		return this;
	};

	Board.setPiece = function(piece, file, rank)
	{
		this.squares[file][rank].setPiece(piece);
	}
	
	Board.removePiece = function(file, rank)
	{
		this.squares[file][rank].removePiece();
	}

	Board.getPiece = function(file, rank)
	{
		return this.squares[file][rank].getPiece(); 
	};

	Board.getSquare = function(file, rank)
	{
		return this.squares[file][rank];
	};

	Board.isWhiteToMove = function()
	{
		return (this.colorToMove == 1?true:false);
	};

	Board.getWhitesCoveredSquares = function()
	{
		this.determineCoveredSquares();
		return this.whiteCoveredSquares;
	};

	Board.getBlacksCoveredSquares = function()
	{
		this.determineCoveredSquares();
		return this.blackCoveredSquares;
	};

	Board.determineCoveredSquares = function()
	{
		this.whiteCoveredSquares = [];
		this.blackCoveredSquares = [];

		// loop all the squares, finding the ones with pieces
		// for each piece, determine coverage
		var covered;
		for(var f = 1; f < 9; f++)
		{
			for(var r = 1; r < 9; r++)
			{
				if(!this.squares[f][r].hasPiece())
					continue;

				covered = this.getCoveredSquares(f,r);

				// push onto the appropriate color array
				var arr = this.blackCoveredSquares;
				if(PieceMap.isWhite(this.squares[f][r].getPiece()))
					arr = this.whiteCoveredSquares;

				for(var i = 0; i < covered.length; i++)
					arr.push(covered[i]);
			}
		}
	};

	Board.getCoveredSquares = function(file, rank)
	{
		var result = [];

		switch(this.squares[file][rank].getPiece())
		{
			case 'K':
			case 'k':
				result = this.getStraightOptions(file,rank,1);
				var diag = this.getDiagonalOptions(file,rank,1);
				for(var i = 0; i < diag.length; i++)
					result.push(diag[i]);
			break;
			default:
				// nothing to do
			break;
		}

		return result;
	};

	Board.getStraightOptions = function(file,rank,limit)
	{
		//console.log(FileMap[file] + rank);
		var options = [];
		for(var i = 1; i <= limit; i++)
		{
			if(rank + i < 9)
				options.push(this.squares[file][rank + i]);

			if(file + i < 9)
				options.push(this.squares[file + i][rank]);

			if(rank - i > 0)
				options.push(this.squares[file][rank - i]);

			if(file - i > 0)
				options.push(this.squares[file - i][rank]);
		}

		return options;
	};

	Board.getDiagonalOptions = function(file,rank,limit)
	{
		var options = [];
		for(var i = 1; i <= limit; i++)
		{
			if(rank + i < 9)
			{
				if(file + i < 9)
					options.push(this.squares[file + i][rank + i]);

				if(file - i > 0)
					options.push(this.squares[file - i][rank + i]);
			}

			if(rank - i > 0)
			{
				if(file + i < 9)
					options.push(this.squares[file + i][rank - i]);

				if(file - i > 0)
					options.push(this.squares[file - i][rank - i]);
			}
		}

		return options;
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
		this.colorToMove = (parts[1] == 'w'?1:0);
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

	// create a new board
	BoardFactory = (function()
	{
		var that = {};
		
		that.create = function()
		{
			return Object.create(Board).init();
		};

		return that;
	})();
// end scope wrapper
})();
