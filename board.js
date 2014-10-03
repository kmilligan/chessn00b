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

	Board.resetCaches = function()
	{
		this.whiteCoveredSquares = [];
		this.blackCoveredSquares = [];
		this.whiteStaticValue = 0;
		this.blackStaticValue = 0;
		this.whiteDynamicValue = 0;
		this.blackDynamicValue = 0;
		this.cachedPositionFEN = null;
		this.validWhiteMoves = [];
		this.validBlackMoves = [];
	};

	Board.setPiece = function(piece, file, rank)
	{
		this.squares[file][rank].setPiece(piece);
	};
	
	Board.removePiece = function(file, rank)
	{
		this.squares[file][rank].removePiece();
	};

	Board.getPiece = function(file, rank)
	{
		return this.squares[file][rank].getPiece(); 
	};

	Board.getSquare = function(file, rank)
	{
		// might have given us algebraic
		if(typeof rank == 'undefined'
			&& typeof file == 'string')
		{
			rank = file.substr(1,1);
			file = FileMap[file.substr(0,1)];
		}

		return this.squares[file][rank];
	};

	Board.isWhiteToMove = function()
	{
		return (this.colorToMove == 1?true:false);
	};

	Board.getWhitesCoveredSquares = function()
	{
		this.determineCoveredSquares(true);
		return this.whiteCoveredSquares;
	};

	Board.getBlacksCoveredSquares = function()
	{
		this.determineCoveredSquares(false);
		return this.blackCoveredSquares;
	};

	Board.getValidMovesForWhite = function()
	{
		this.determineValidMoves(true);
		return this.validWhiteMoves;
	};

	Board.getValidMovesForBlack = function()
	{
		this.determineValidMoves(false);
		return this.validBlackMoves;
	};

	Board.determineValidMoves = function(forWhite)
	{
		// already done this?
		if((forWhite && this.validWhiteMoves.length > 0)
			|| (!forWhite && this.validBlackMoves.length > 0))
			return;

		if(forWhite)
			this.validWhiteMoves = [];

		if(!forWhite)
			this.validBlackMoves = [];

		var curr, move;
		var isWhite;
		var moves;

		for(var f = 1; f < 9; f++)
		{
			for(var r = 1; r < 9; r++)
			{
				if(!this.squares[f][r].hasPiece())
					continue;

				curr = this.squares[f][r].name;
				isWhite = PieceMap.isWhite(this.squares[f][r].getPiece());

				if(isWhite != forWhite)
					continue;

				moves = this.getValidMovesForSquare(f,r);
				for(var i = 0; i < moves.length; i++)
				{
					move = '' + curr + moves[i].name;
					if(isWhite)
						this.validWhiteMoves.push(move);
					else
						this.validBlackMoves.push(move);
				}
			}
		}
	};

	Board.getValidMovesForSquare = function(fileOrSquare, rank)
	{
		var result = [];
		var square;
		if(typeof fileOrSquare == 'object')
			square = fileOrSquare;
		else
			square = this.squares[fileOrSquare][rank];

		if(!square.hasPiece())
			return result;

		var piece = square.getPiece();
		var isWhite = PieceMap.isWhite(piece);
		var isKing = (piece == 'k' || piece == 'K')?true:false;
		var isPawn = (piece == 'p' || piece == 'P')?true:false;

		var currFEN = this.getPositionFEN();
		var postMoveBoard = BoardFactory.create();
		var possible = this.getCoveredSquares(square);

		if(possible.length == 0)
			return result;

		for(var i = 0; i < possible.length; i++)
		{
			// can't move to where our own pieces are
			if(possible[i].hasPiece()
				&& PieceMap.isWhite(possible[i].getPiece()) == isWhite)
				continue;

			// pawn can only move to a covered if an opposing piece is there
			if(isPawn)
			{
				if(!possible[i].hasPiece())
					continue;
			}

			// can't make any move if it would cause check
			postMoveBoard.setFEN(currFEN);
			var notation = '' + square.name + possible[i].name;
			postMoveBoard.move(notation, true);
			if((isWhite && postMoveBoard.whiteInCheck())
				|| (!isWhite && postMoveBoard.blackInCheck()))
				continue;

			result.push(possible[i]);
		}

		// for pawns, we may also be able to move directly ahead...
		// just not if there are pieces there.
		if(isPawn)
		{
			if(isWhite)
			{
				if(	square.rank < 8 &&
					!this.squares[square.file][square.rank + 1].hasPiece())
				{
					result.push(this.squares[square.file][square.rank + 1]);

					if(square.rank == 2 &&
						!this.squares[square.file][square.rank + 2].hasPiece())
						result.push(this.squares[square.file][square.rank + 2]);
				}
			}
			else
			{
				if(	square.rank > 1 &&
					!this.squares[square.file][square.rank - 1].hasPiece())
				{
					result.push(this.squares[square.file][square.rank - 1]);

					if(square.rank == 7 &&
						!this.squares[square.file][square.rank - 2].hasPiece())
						result.push(this.squares[square.file][square.rank - 2]);
				}
			}
		}

		return result;
	};

	// expecting square objects
	Board.isValidMove = function(start, end)
	{
		var valids = this.getValidMovesForSquare(start);
		for(var i = 0; i < valids.length; i++)
		{
			if(valids[i] === end)
				return true;
		};

		return false;
	};

	Board.determineCoveredSquares = function(forWhite)
	{
		// already figured this out?
		if( (forWhite && this.whiteCoveredSquares.length > 0 )
			|| (!forWhite && this.blackCoveredSquares.legnth > 0 ))
			return;

		if(forWhite)
			this.whiteCoveredSquares = [];
	
		if(!forWhite)
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
	
				var isWhite = PieceMap.isWhite(this.squares[f][r].getPiece());

				if(isWhite != forWhite)
					continue;

				covered = this.getCoveredSquares(f,r);

				// push onto the appropriate color array
				var arr = this.blackCoveredSquares;
				if(isWhite)
					arr = this.whiteCoveredSquares;

				for(var i = 0; i < covered.length; i++)
					arr.push(covered[i]);
			}
		}
	};

	Board.getCoveredSquares = function(fileOrSquare, rank)
	{
		var file;
		if(typeof fileOrSquare == 'object')
		{
			file = fileOrSquare.file;
			rank = fileOrSquare.rank;
		}
		else
		{
			file = fileOrSquare;
		}

		var result = [];
		var diag = [];

		switch(this.squares[file][rank].getPiece())
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
		// keep track when we run into something in each direction
		var stop1 = false;
		var stop2 = false;
		var stop3 = false;
		var stop4 = false;
		//console.log(FileMap[file] + rank);
		var options = [];
		for(var i = 1; i <= limit; i++)
		{
			if(rank + i < 9 && !stop1)
			{
				options.push(this.squares[file][rank + i]);
				if(this.squares[file][rank + i].hasPiece())
					stop1 = true;
			}

			if(file + i < 9 && !stop2)
			{
				options.push(this.squares[file + i][rank]);
				if(this.squares[file + i][rank].hasPiece())
					stop2 = true;
			}

			if(rank - i > 0 && !stop3)
			{
				options.push(this.squares[file][rank - i]);
				if(this.squares[file][rank - i].hasPiece())
					stop3 = true;
			}

			if(file - i > 0 && !stop4)
			{
				options.push(this.squares[file - i][rank]);
				if(this.squares[file - i][rank].hasPiece())
					stop4 = true;
			}
		}

		return options;
	};

	Board.getDiagonalOptions = function(file,rank,limit)
	{
		// keep track when we run into something in each direction
		var stop1 = false;
		var stop2 = false;
		var stop3 = false;
		var stop4 = false;
		var currF, currR;
		var options = [];
		for(var i = 1; i <= limit; i++)
		{
			if(rank + i < 9)
			{
				currR = rank + i;
				if(file + i < 9 && !stop1)
				{
					currF = file + i;
					options.push(this.squares[currF][currR]);
					if(this.squares[currF][currR].hasPiece())
						stop1 = true;
				}

				if(file - i > 0 && !stop2)
				{
					currF = file - i;
					options.push(this.squares[currF][currR]);
					if(this.squares[currF][currR].hasPiece())
						stop2 = true;
				}
			}

			if(rank - i > 0)
			{
				currR = rank - i;
				if(file + i < 9 && !stop3)
				{
					currF = file + i;
					options.push(this.squares[currF][currR]);
					if(this.squares[currF][currR].hasPiece())
						stop3 = true;
				}

				if(file - i > 0 && !stop4)
				{
					currF = file - i;
					options.push(this.squares[currF][currR]);
					if(this.squares[currF][currR].hasPiece())
						stop4 = true;
				}
			}
		}

		return options;
	};

	Board.getKnightOptions = function(file,rank)
	{
		var options = [];
		// check to the left...
		if(file - 1 > 0)
		{
			if(rank + 2 < 9)
				options.push(this.squares[file - 1][rank + 2]);

			if(rank - 2 > 0)
				options.push(this.squares[file - 1][rank - 2]);

			if(file - 2 > 0)
			{
				if(rank + 1 < 9)
					options.push(this.squares[file - 2][rank + 1]);

				if(rank - 1 > 0)
					options.push(this.squares[file - 2][rank - 1]);
			}
		}

		// ...now to the right
		if(file + 1 < 9)
		{
			if(rank + 2 < 9)
				options.push(this.squares[file + 1][rank + 2]);

			if(rank - 2 > 0)
				options.push(this.squares[file + 1][rank - 2]);

			if(file + 2 < 9)
			{
				if(rank + 1 < 9)
					options.push(this.squares[file + 2][rank + 1]);

				if(rank - 1 > 0)
					options.push(this.squares[file + 2][rank - 1]);
			}
		}

		return options;
	};

	Board.getPawnOptions = function(file,rank)
	{
		var options = [];
		
		// need the color for direction
		if(PieceMap.isWhite(this.squares[file][rank].getPiece()))
		{
			if(rank < 8)
			{
				if(file > 1)
					options.push(this.squares[file - 1][rank + 1]);

				if(file < 8)
					options.push(this.squares[file + 1][rank + 1]);
			}
		}
		else
		{
			if(rank > 1)
			{
				if(file > 1)
					options.push(this.squares[file - 1][rank - 1]);

				if(file < 8)
					options.push(this.squares[file + 1][rank - 1]);
			}
		}
		
		return options;
	};

	Board.findPiece = function(piece)
	{
		var found = [];
		for(var f = 1; f < 9; f++)
		{
			for(var r = 1; r < 9; r++)
			{
				if(!this.squares[f][r].hasPiece())
					continue;

				if(this.squares[f][r].getPiece() == piece)
					found.push(this.squares[f][r]);
			}
		}
		return found;
	};

	Board.isSquareAttacked = function(square)
	{
		if(!square.hasPiece())
			return false;

		var covers;
		if(PieceMap.isWhite(square.getPiece()))
			covers = this.getBlacksCoveredSquares();
		else
			covers = this.getWhitesCoveredSquares();

		for(var i = 0; i < covers.length; i++)
		{
			if(covers[i] === square)
				return true;
		}

		return false;
	};

	Board.isSquareAttackedByWhite = function(fileOrSquare, rank)
	{
		var square;
		if(typeof fileOrSquare == 'object')
			square = fileOrSquare;
		else
			square = this.squares[fileOrSquare][rank];

		var covers = this.getWhitesCoveredSquares();

		for(var i = 0; i < covers.length; i++)
		{
			if(covers[i] === square)
				return true;
		}

		return false;
	};

	Board.isSquareAttackedByBlack = function(fileOrSquare, rank)
	{
		var square;
		if(typeof fileOrSquare == 'object')
			square = fileOrSquare;
		else
			square = this.squares[fileOrSquare][rank];

		var covers = this.getBlacksCoveredSquares();

		for(var i = 0; i < covers.length; i++)
		{
			if(covers[i] === square)
				return true;
		}

		return false;
	};

	Board.getPositionFEN = function()
	{
		if(this.cachedPositionFEN)
			return this.cachedPositionFEN;

		var ranks = [];
		for(var r = 8; r > 0; r--)
		{
			var currRank = '';
			var empty = 0;
			for(var f = 1; f < 9; f++)
			{
				if(!this.squares[f][r].hasPiece())
				{
					empty++;
					continue;
				}

				if(empty > 0)
				{
					currRank += empty;
					empty = 0;
				}

				currRank += this.squares[f][r].getPiece();
			}
			
			if(empty > 0)
			{
				currRank += empty;
				empty = 0;
			}

			ranks.push(currRank);
		}

		this.cachedPositionFEN = ranks.join('/');
		return this.cachedPositionFEN;
	};

	Board.setFEN = function(fen)
	{
		this.resetCaches();
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

	Board.blackInCheck = function()
	{
		var king = this.findPiece('k');
		if(king.length == 0)
			return false;

		return this.isSquareAttacked(king[0]);
	};

	Board.whiteInCheck = function()
	{
		var king = this.findPiece('K');
		if(king.length == 0)
			return false;

		return this.isSquareAttacked(king[0]);
	};

	Board.blackInCheckmate = function()
	{
		var king = this.findPiece('k');
		if(king.length == 0)
			return false;

		return (this.isSquareAttacked(king[0])
				&& this.getValidMovesForSquare(king[0]).length == 0);
	};

	Board.whiteInCheckmate = function()
	{
		var king = this.findPiece('K');
		if(king.length == 0)
			return false;

		return (this.isSquareAttacked(king[0])
				&& this.getValidMovesForSquare(king[0]).length == 0);
	};

	Board.moves = function(moves)
	{
		if(typeof moves == 'string')
			moves = moves.split(' ');

		for(var i = 0; i < moves.length; i++)
		{
			if(!this.move(moves[i]))
				return false;
		}

		return true;
	};

	// expected: long algegraic; i.e. "e2e4"
	// returns boolean if move was executed successfully
	Board.move = function(notation, skipValidCheck)
	{
		var skipValidCheck = skipValidCheck === true?true:false;
		var start = notation.substr(0,2);
		var end = notation.substr(2,2);
		// if there's anything left, it's a promotion
		var promotion = '';
		if(notation.length > 4)
			promotion = notation.substr(4,1);

		var startSquare = this.getSquare(start);

		// can only move if we have something to move!
		if(!startSquare || !startSquare.hasPiece())
			return false;

		var endSquare = this.getSquare(end);

		// valid move?
		// not clear we should be checking this here...
		// like maybe should have been done before hand?
		if(	!skipValidCheck &&
			!this.isValidMove(startSquare, endSquare))
		{
			// exception?
			return false;
		}

		// actually move the piece
		var piece = startSquare.getPiece();
		startSquare.removePiece();
		endSquare.setPiece(piece);

		// our caches are no longer valid
		this.resetCaches();

		return true;
	};

	Board.getWhiteStaticValue = function()
	{
		this.determineStaticValues();
		return this.whiteStaticValue;
		
	};

	Board.getBlackStaticValue = function()
	{
		this.determineStaticValues();
		return this.blackStaticValue;
	};

	Board.determineStaticValues = function()
	{
		// already done this?
		if(this.whiteStaticValue > 0
			|| this.blackStaticValue > 0)
			return;

		this.whiteStaticValue = 0;
		this.blackStaticValue = 0;
		var curr;

		for(var f = 1; f < 9; f++)
		{
			for(var r = 1; r < 9; r++)
			{
				if(!this.squares[f][r].hasPiece())
					continue;

				switch(this.squares[f][r].getPiece())
				{
					case 'Q':
					case 'q':
						curr = 9;
					break;
					case 'R':
					case 'r':
						curr = 5;
					break;
					case 'B':
					case 'b':
						curr = 3;
					break;
					case 'N':
					case 'n':
						curr = 3;
					break;
					case 'P':
					case 'p':
						curr = 1;
					break;
					default:
						continue;
				}

				// give us more room for dynamic values
				curr *= 10;

				if(PieceMap.isWhite(this.squares[f][r].getPiece()))
					this.whiteStaticValue += curr;
				else
					this.blackStaticValue += curr;
			}
		}
	};

	Board.getWhiteDynamicValue = function()
	{
		this.determineDynamicValues();
		return this.whiteDynamicValue;
	};

	Board.getBlackDynamicValue = function()
	{
		this.determineDynamicValues();
		return this.blackDynamicValue;
	};

	// based on position
	Board.determineDynamicValues = function()
	{
		// already done this?
		if(this.whiteDynamicValue > 0
			|| this.blackDynamicValue > 0)
			return;

		this.whiteDynamicValue = 0;
		this.blackDynamicValue = 0;

		// do we have both bishops?
		if(this.findPiece('b').length >= 2)
			this.blackDynamicValue += 10;

		if(this.findPiece('B').length >= 2)
			this.whiteDynamicValue += 10;

		// how much space to our pieces have?
		var divisor = 1;
		var covers = this.getBlacksCoveredSquares();
		this.blackDynamicValue += Math.round(covers.length / divisor);

		var covers = this.getWhitesCoveredSquares();
		this.whiteDynamicValue += Math.round(covers.length / divisor);
	};

	Board.getBestMoveForWhite = function()
	{
		return this.getBestMove(true);
	};
	
	Board.getBestMoveForBlack = function()
	{
		return this.getBestMove(false);
	};
	
	Board.getBestMoveSimple = function(forWhite)
	{
		var moveValues = [];
		for(var f = 1; f < 9; f++)
		{
			for(var r = 1; r < 9; r++)
			{
				if(!this.squares[f][r].hasPiece())
					continue;

				if(PieceMap.isWhite(this.squares[f][r].getPiece()) != forWhite)
					continue;

				var moves = this.getValidMovesForSquare(f,r);

				if(moves.length == 0)
					continue;

				for(var i = 0; i < moves.length; i++)
				{
					var notation = '' + this.squares[f][r].name + moves[i].name;
					
					// found checkmate. all done.
					var val = this.evaluateMove(notation);
					if(Math.abs(val) == 1000)
						return notation;

					// otherwise, keep track and we'll sort it later.
					moveValues.push({ move: notation, value: val });
				}
			}
		}

		// which direction depends on which side we're looking at
		var sorter = function(a,b)
		{
			return a.value - b.value;
		};

		if(forWhite)
		{
			var sorter = function(a,b)
			{
				return b.value - a.value;
			};
		}

		moveValues.sort(sorter);

		if(this.mark)
		{
			for(var i = 0; i < moveValues.length; i++)
				console.log(moveValues[i].move + ': ' + moveValues[i].value);
		}

		return moveValues[0].move;
	};

	Board.evaluateMove = function(notation)
	{
		var board = this.clone();
		board.move(notation);
		return board.evaluatePosition();
	};

	Board.clone = function()
	{
		// this isn't a true, separate clone...
		var board = BoardFactory.create();
		board.setFEN(this.getPositionFEN());
		// doesn't seem to work, not sure why
		//var board = jQuery.extend(true, {}, this);
		// doesn't work for complex objects
		//var board = JSON.parse(JSON.stringify(this));
		return board;
	};
	
	var abExamined;
	var fenEvals;
	Board.getBestMove = function(forWhite)
	{
		this.lastBestMove = '';
		abExamined = 0;
		fenEvals = {};
		this.alphabeta(3, -10000, 10000, forWhite);
		this.dump();
		console.log((forWhite?'white':'black') + ' to move; num examined: ' + abExamined + '; best: ' + this.lastBestMove);
		return this.lastBestMove;
	};

	Board.alphabeta = function(depth, a, b, isWhite)
	{
		abExamined++;
		var currFEN = this.getPositionFEN();

		// test terminal conditions
		if(depth == 0)
		{
			if(fenEvals[currFEN])
				return fenEvals[currFEN];

			var val = this.evaluatePosition();
			fenEvals[currFEN] = val;

			//console.log('leaf: ' + val);
			return val;
		}

		var board = this.clone();
		var moves;
		var curr;
		if(isWhite)
		{
			moves = this.getValidMovesForWhite();
			for(var i = 0; i < moves.length; i++)
			{
				board.setFEN(currFEN);
				board.move(moves[i]);
				curr = a;

				if(board.blackInCheckmate())
				{
					a = 1000;
					this.lastBestMove = moves[i];
					break;
				}
				else
					a = Math.max(a, board.alphabeta(depth - 1, a, b, !isWhite));

				if(curr != a)
					this.lastBestMove = moves[i];
				
				if(b <= a)
					break;
			}
			return a;
		}
		else
		{
			moves = this.getValidMovesForBlack();
			for(var i = 0; i < moves.length; i++)
			{
				board.setFEN(currFEN);
				board.move(moves[i]);
				curr = b;

				if(board.whiteInCheckmate())
				{
					b = -1000;
					this.lastBestMove = moves[i];
					break;
				}
				else
					b = Math.min(b, board.alphabeta(depth - 1, a, b, !isWhite));

				if(curr != b)
					this.lastBestMove = moves[i];

				if(b <= a)
					break;
			}

			return b;
		}
	};

	Board.evaluatePosition = function()
	{
		if(this.whiteInCheckmate())
			return -1000;
		else if(this.blackInCheckmate())
			return 1000;

		var value = 0;

		value += this.getWhiteStaticValue();
		value -= this.getBlackStaticValue();
		value += this.getWhiteDynamicValue();
		value -= this.getBlackDynamicValue();
	
		/*
		console.log(notation + ': ' + value);
		console.log(this.getWhiteStaticValue() + ',' +
					this.getBlackStaticValue() + ',' +
					this.getWhiteDynamicValue() + ',' +
					this.getBlackDynamicValue());
		this.dump();
		*/
		return value;
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
				if(!this.squares[f][r].hasPiece())
					rankOut += ' ';
				else
					rankOut += this.squares[f][r].getPiece();

				rankOut += '|';
			}
			console.log(rankOut);
			console.log(divider);
		}
	}

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
