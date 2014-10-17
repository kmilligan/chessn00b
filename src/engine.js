/**
* Simple javascript chess engine.
*
*@author Kurt Milligan
*/

// have what we need?
if(typeof BoardFactory === 'undefined')
{
	// because throwing doesn't always render??
	if(console)
		console.log('Missing the BoardFactory!');
	throw new Error('Missing the BoardFactory!');
}

// access point
var EngineFactory;

// scope wrapper
(function() 
{
	"use strict";

	var PieceMap = BoardFactory.getPieceMap();
	var ColorMap = BoardFactory.getColorMap();

	/**
	* Object representing the engine;
	* hasA board
	*/
	var Engine = {};	
	Engine.init = function(board)
	{
		this.board = board;
		this.resetCaches();
		return this;
	};

	Engine.resetCaches = function()
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

	Engine.setFEN = function(fen)
	{
		this.resetCaches();
		this.board.setFEN(fen);
	};

	Engine.getWhitesCoveredSquares = function()
	{
		this.determineCoveredSquares(true);
		return this.whiteCoveredSquares;
	};

	Engine.getBlacksCoveredSquares = function()
	{
		this.determineCoveredSquares(false);
		return this.blackCoveredSquares;
	};

	Engine.getValidMovesForWhite = function()
	{
		this.determineValidMoves(true);
		return this.validWhiteMoves;
	};

	Engine.getValidMovesForBlack = function()
	{
		this.determineValidMoves(false);
		return this.validBlackMoves;
	};

	Engine.determineValidMoves = function(forWhite)
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
				if(!this.board.squares[f][r].hasPiece())
					continue;

				curr = this.board.squares[f][r].name;
				isWhite = PieceMap.isWhite(this.board.squares[f][r].getPiece());

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

	Engine.getValidMovesForSquare = function(fileOrSquare, rank)
	{
		var result = [];
		var square;
		if(typeof fileOrSquare == 'object')
			square = fileOrSquare;
		else
			square = this.board.squares[fileOrSquare][rank];

		if(!square.hasPiece())
			return result;

		var piece = square.getPiece();
		var isWhite = PieceMap.isWhite(piece);
		var isKing = (piece == 'k' || piece == 'K')?true:false;
		var isPawn = (piece == 'p' || piece == 'P')?true:false;

		var currFEN = this.getPositionFEN();
		var postMoveEngine = EngineFactory.create();
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
			postMoveEngine.setFEN(currFEN);
			var notation = '' + square.name + possible[i].name;
			postMoveEngine.move(notation, true);
			if((isWhite && postMoveEngine.whiteInCheck())
				|| (!isWhite && postMoveEngine.blackInCheck()))
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
					!this.board.squares[square.file][square.rank + 1].hasPiece())
				{
					// still have to make sure wouldn't cause check.
					postMoveEngine.setFEN(currFEN);
					var notation = '' + square.name 
						+ this.board.squares[square.file][square.rank + 1].name;
					postMoveEngine.move(notation, true);

					if(!postMoveEngine.whiteInCheck())
						result.push(this.board.squares[square.file][square.rank + 1]);

					if(square.rank == 2 &&
						!this.board.squares[square.file][square.rank + 2].hasPiece())
					{
						postMoveEngine.setFEN(currFEN);
						var notation = '' + square.name 
							+ this.board.squares[square.file][square.rank + 2].name;
						postMoveEngine.move(notation, true);

						if(!postMoveEngine.whiteInCheck())
							result.push(this.board.squares[square.file][square.rank + 2]);
					}
				}
			}
			else
			{
				if(	square.rank > 1 &&
					!this.board.squares[square.file][square.rank - 1].hasPiece())
				{
					// still have to make sure wouldn't cause check.
					postMoveEngine.setFEN(currFEN);
					var notation = '' + square.name 
						+ this.board.squares[square.file][square.rank - 1].name;
					postMoveEngine.move(notation, true);

					if(!postMoveEngine.blackInCheck())
						result.push(this.board.squares[square.file][square.rank - 1]);

					if(square.rank == 7 &&
						!this.board.squares[square.file][square.rank - 2].hasPiece())
					{
						postMoveEngine.setFEN(currFEN);
						var notation = '' + square.name 
							+ this.board.squares[square.file][square.rank - 2].name;
						postMoveEngine.move(notation, true);

						if(!postMoveEngine.blackInCheck())
							result.push(this.board.squares[square.file][square.rank - 2]);
					}
				}
			}
		}

		// might be able to castle
		if(isKing)
		{
			if(isWhite
				&& !this.whiteInCheck())
			{
				if(this.board.castlingOptions.indexOf('K') >= 0
					&& !this.board.squares[square.file + 1][square.rank].hasPiece()
					&& !this.isSquareAttackedByBlack(
						this.board.squares[square.file + 1][square.rank])
					&& !this.board.squares[square.file + 2][square.rank].hasPiece()
					&& !this.isSquareAttackedByBlack(
						this.board.squares[square.file + 2][square.rank])
					)
				{
					result.push(this.board.squares[square.file + 2][square.rank]);
				}
				
				if(this.board.castlingOptions.indexOf('Q') >= 0
					&& !this.board.squares[square.file - 1][square.rank].hasPiece()
					&& !this.isSquareAttackedByBlack(
						this.board.squares[square.file - 1][square.rank])
					&& !this.board.squares[square.file - 2][square.rank].hasPiece()
					&& !this.isSquareAttackedByBlack(
						this.board.squares[square.file - 2][square.rank])
					)
				{
					result.push(this.board.squares[square.file - 2][square.rank]);
				}
			}
			else if(!isWhite
				&& !this.blackInCheck())
			{
				if(this.board.castlingOptions.indexOf('k') >= 0
					&& !this.board.squares[square.file + 1][square.rank].hasPiece()
					&& !this.isSquareAttackedByWhite(
						this.board.squares[square.file + 1][square.rank])
					&& !this.board.squares[square.file + 2][square.rank].hasPiece()
					&& !this.isSquareAttackedByWhite(
						this.board.squares[square.file + 2][square.rank])
					)
				{
					result.push(this.board.squares[square.file + 2][square.rank]);
				}

				if(this.board.castlingOptions.indexOf('q') >= 0
					&& !this.board.squares[square.file - 1][square.rank].hasPiece()
					&& !this.isSquareAttackedByWhite(
						this.board.squares[square.file - 1][square.rank])
					&& !this.board.squares[square.file - 2][square.rank].hasPiece()
					&& !this.isSquareAttackedByWhite(
						this.board.squares[square.file - 2][square.rank])
					)
				{
					result.push(this.board.squares[square.file - 2][square.rank]);
				}

			}
		}

		return result;
	};

	// expecting square objects for start & end
	// or a "move" notation
	Engine.isValidMove = function(startOrMove, end)
	{
		var start;
		if(typeof startOrMove == 'object')
			start = startOrMove;
		else
		{
			start = this.board.getSquare(startOrMove.substr(0,2));
			end = this.board.getSquare(startOrMove.substr(2,2));
		}

		// no piece?
		if(!start.hasPiece())
			return false;

		// not your turn?
		if(PieceMap.getColor(start.getPiece()) != this.board.getColorToMove())
			return false;

		var valids = this.getValidMovesForSquare(start);
		for(var i = 0; i < valids.length; i++)
		{
			if(valids[i] === end)
				return true;
		};

		return false;
	};

	Engine.determineCoveredSquares = function(forWhite)
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
				if(!this.board.squares[f][r].hasPiece())
					continue;
	
				var isWhite = PieceMap.isWhite(this.board.squares[f][r].getPiece());

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

	Engine.getCoveredSquares = function(fileOrSquare, rank)
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

		switch(this.board.squares[file][rank].getPiece())
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

	Engine.getStraightOptions = function(file,rank,limit)
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
				options.push(this.board.squares[file][rank + i]);
				if(this.board.squares[file][rank + i].hasPiece())
					stop1 = true;
			}

			if(file + i < 9 && !stop2)
			{
				options.push(this.board.squares[file + i][rank]);
				if(this.board.squares[file + i][rank].hasPiece())
					stop2 = true;
			}

			if(rank - i > 0 && !stop3)
			{
				options.push(this.board.squares[file][rank - i]);
				if(this.board.squares[file][rank - i].hasPiece())
					stop3 = true;
			}

			if(file - i > 0 && !stop4)
			{
				options.push(this.board.squares[file - i][rank]);
				if(this.board.squares[file - i][rank].hasPiece())
					stop4 = true;
			}
		}

		return options;
	};

	Engine.getDiagonalOptions = function(file,rank,limit)
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
					options.push(this.board.squares[currF][currR]);
					if(this.board.squares[currF][currR].hasPiece())
						stop1 = true;
				}

				if(file - i > 0 && !stop2)
				{
					currF = file - i;
					options.push(this.board.squares[currF][currR]);
					if(this.board.squares[currF][currR].hasPiece())
						stop2 = true;
				}
			}

			if(rank - i > 0)
			{
				currR = rank - i;
				if(file + i < 9 && !stop3)
				{
					currF = file + i;
					options.push(this.board.squares[currF][currR]);
					if(this.board.squares[currF][currR].hasPiece())
						stop3 = true;
				}

				if(file - i > 0 && !stop4)
				{
					currF = file - i;
					options.push(this.board.squares[currF][currR]);
					if(this.board.squares[currF][currR].hasPiece())
						stop4 = true;
				}
			}
		}

		return options;
	};

	Engine.getKnightOptions = function(file,rank)
	{
		var options = [];
		// check to the left...
		if(file - 1 > 0)
		{
			if(rank + 2 < 9)
				options.push(this.board.squares[file - 1][rank + 2]);

			if(rank - 2 > 0)
				options.push(this.board.squares[file - 1][rank - 2]);

			if(file - 2 > 0)
			{
				if(rank + 1 < 9)
					options.push(this.board.squares[file - 2][rank + 1]);

				if(rank - 1 > 0)
					options.push(this.board.squares[file - 2][rank - 1]);
			}
		}

		// ...now to the right
		if(file + 1 < 9)
		{
			if(rank + 2 < 9)
				options.push(this.board.squares[file + 1][rank + 2]);

			if(rank - 2 > 0)
				options.push(this.board.squares[file + 1][rank - 2]);

			if(file + 2 < 9)
			{
				if(rank + 1 < 9)
					options.push(this.board.squares[file + 2][rank + 1]);

				if(rank - 1 > 0)
					options.push(this.board.squares[file + 2][rank - 1]);
			}
		}

		return options;
	};

	Engine.getPawnOptions = function(file,rank)
	{
		var options = [];
		
		// need the color for direction
		if(PieceMap.isWhite(this.board.squares[file][rank].getPiece()))
		{
			if(rank < 8)
			{
				if(file > 1)
					options.push(this.board.squares[file - 1][rank + 1]);

				if(file < 8)
					options.push(this.board.squares[file + 1][rank + 1]);
			}
		}
		else
		{
			if(rank > 1)
			{
				if(file > 1)
					options.push(this.board.squares[file - 1][rank - 1]);

				if(file < 8)
					options.push(this.board.squares[file + 1][rank - 1]);
			}
		}
		
		return options;
	};

	Engine.findPiece = function(piece)
	{
		var found = [];
		for(var f = 1; f < 9; f++)
		{
			for(var r = 1; r < 9; r++)
			{
				if(!this.board.squares[f][r].hasPiece())
					continue;

				if(this.board.squares[f][r].getPiece() == piece)
					found.push(this.board.squares[f][r]);
			}
		}
		return found;
	};

	Engine.isSquareAttacked = function(square)
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

	Engine.isSquareAttackedByWhite = function(fileOrSquare, rank)
	{
		var square;
		if(typeof fileOrSquare == 'object')
			square = fileOrSquare;
		else
			square = this.board.squares[fileOrSquare][rank];

		var covers = this.getWhitesCoveredSquares();

		for(var i = 0; i < covers.length; i++)
		{
			if(covers[i] === square)
				return true;
		}

		return false;
	};

	Engine.isSquareAttackedByBlack = function(fileOrSquare, rank)
	{
		var square;
		if(typeof fileOrSquare == 'object')
			square = fileOrSquare;
		else
			square = this.board.squares[fileOrSquare][rank];

		var covers = this.getBlacksCoveredSquares();

		for(var i = 0; i < covers.length; i++)
		{
			if(covers[i] === square)
				return true;
		}

		return false;
	};

	Engine.getPositionFEN = function()
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
				if(!this.board.squares[f][r].hasPiece())
				{
					empty++;
					continue;
				}

				if(empty > 0)
				{
					currRank += empty;
					empty = 0;
				}

				currRank += this.board.squares[f][r].getPiece();
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

	Engine.setFEN = function(fen)
	{
		this.resetCaches();
		this.board.setFEN(fen);
	};

	Engine.blackInCheck = function()
	{
		var king = this.findPiece('k');
		if(king.length == 0)
			return false;

		return this.isSquareAttacked(king[0]);
	};

	Engine.whiteInCheck = function()
	{
		var king = this.findPiece('K');
		if(king.length == 0)
			return false;

		return this.isSquareAttacked(king[0]);
	};

	Engine.blackInCheckmate = function()
	{
		var king = this.findPiece('k');
		if(king.length == 0)
			return false;

		return (this.isSquareAttacked(king[0])
				&& this.getValidMovesForSquare(king[0]).length == 0);
	};

	Engine.whiteInCheckmate = function()
	{
		var king = this.findPiece('K');
		if(king.length == 0)
			return false;

		return (this.isSquareAttacked(king[0])
				&& this.getValidMovesForSquare(king[0]).length == 0);
	};

	Engine.moves = function(moves)
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
	Engine.move = function(notation, skipValidCheck)
	{
		var skipValidCheck = skipValidCheck === true?true:false;
		var start = notation.substr(0,2);
		var end = notation.substr(2,2);
		// if there's anything left, it's a promotion
		var promotion = '';
		if(notation.length > 4)
			promotion = notation.substr(4,1);

		var startSquare = this.board.getSquare(start);

		// can only move if we have something to move!
		if(!startSquare || !startSquare.hasPiece())
			return false;

		var endSquare = this.board.getSquare(end);

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

		// castling?
		var isKing = (piece == 'k' || piece == 'K')?true:false;
		if(isKing && Math.abs(startSquare.file - endSquare.file) == 2)
		{
			var rookSquare;
			var targetSquare;
			if(endSquare.file > startSquare.file)
			{
				rookSquare = this.board.squares[endSquare.file + 1][endSquare.rank];
				targetSquare = this.board.squares[endSquare.file - 1][endSquare.rank];
			}
			else
			{
				rookSquare = this.board.squares[endSquare.file -2][endSquare.rank];
				targetSquare = this.board.squares[endSquare.file + 1][endSquare.rank];
			}

			var rook = rookSquare.getPiece();
			rookSquare.removePiece();
			targetSquare.setPiece(rook);
		}

		// update move number/color
		this.board.incrementMove();

		// our caches are no longer valid
		this.resetCaches();

		return true;
	};

	Engine.getWhiteStaticValue = function()
	{
		this.determineStaticValues();
		return this.whiteStaticValue;
		
	};

	Engine.getBlackStaticValue = function()
	{
		this.determineStaticValues();
		return this.blackStaticValue;
	};

	Engine.determineStaticValues = function()
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
				if(!this.board.squares[f][r].hasPiece())
					continue;

				switch(this.board.squares[f][r].getPiece())
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

				if(PieceMap.isWhite(this.board.squares[f][r].getPiece()))
					this.whiteStaticValue += curr;
				else
					this.blackStaticValue += curr;
			}
		}
	};

	Engine.getWhiteDynamicValue = function()
	{
		this.determineDynamicValues();
		return this.whiteDynamicValue;
	};

	Engine.getBlackDynamicValue = function()
	{
		this.determineDynamicValues();
		return this.blackDynamicValue;
	};

	// based on position
	Engine.determineDynamicValues = function()
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

	Engine.getBestMoveForWhite = function()
	{
		return this.getBestMove(true);
	};
	
	Engine.getBestMoveForBlack = function()
	{
		return this.getBestMove(false);
	};
	
	Engine.getBestMoveSimple = function(forWhite)
	{
		var moveValues = [];
		for(var f = 1; f < 9; f++)
		{
			for(var r = 1; r < 9; r++)
			{
				if(!this.board.squares[f][r].hasPiece())
					continue;

				if(PieceMap.isWhite(this.board.squares[f][r].getPiece()) != forWhite)
					continue;

				var moves = this.getValidMovesForSquare(f,r);

				if(moves.length == 0)
					continue;

				for(var i = 0; i < moves.length; i++)
				{
					var notation = '' + this.board.squares[f][r].name + moves[i].name;
					
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

	Engine.evaluateMove = function(notation)
	{
		var board = this.clone();
		board.move(notation);
		return board.evaluatePosition();
	};

	Engine.clone = function()
	{
		// this isn't a true, separate clone...
		var board = EngineFactory.create();
		board.setFEN(this.getPositionFEN()
			+ ' '
			+ (this.board.getColorToMove() == ColorMap.white?'w':'b'));
		// doesn't seem to work, not sure why
		//var board = jQuery.extend(true, {}, this);
		// doesn't work for complex objects
		//var board = JSON.parse(JSON.stringify(this));
		return board;
	};
	
	var abExamined;
	var fenEvals;
	Engine.getBestMove = function(forWhite)
	{
		this.lastBestMove = '';
		this.lastValue = 0;
		abExamined = 0;
		fenEvals = {};
		var start = new Date().getTime();
		this.alphabeta(3, -10000, 10000, forWhite);
		var end = new Date().getTime();
		var diff = (end - start) / 1000;
		//this.board.dump();
		console.log(
			(forWhite?'white':'black') + ' to move '
			+';examined: ' + abExamined 
			+ ' nodes in ' + diff + 's' 
			+ '; best: ' + this.lastBestMove
			+ ' (' + this.lastValue + ')');
		return this.lastBestMove;
	};

	Engine.alphabeta = function(depth, a, b, isWhite)
	{
		abExamined++;
		var currFEN = this.getPositionFEN()
			+ ' ' + (this.board.getColorToMove() == ColorMap.white?'w':'b');
		var val;

		// test terminal conditions
		if(depth == 0)
		{
			if(fenEvals[currFEN])
				return fenEvals[currFEN];

			val = this.evaluatePosition();
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
					this.lastValue = a;
					break;
				}
				else
				{
					val = board.alphabeta(depth - 1, a, b, !isWhite);
					a = Math.max(a, val);
				}

				if(curr != a)
				{
					this.lastBestMove = moves[i];
					this.lastValue = val;
				}
				
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
					this.lastValue = b;
					break;
				}
				else
				{
					val = board.alphabeta(depth - 1, a, b, !isWhite);
					b = Math.min(b, val);
				}

				if(curr != b)
				{
					this.lastBestMove = moves[i];
					this.lastValue = b;
				}

				if(b <= a)
					break;
			}

			return b;
		}
	};

	Engine.evaluatePosition = function()
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

	// create a new engine
	EngineFactory = (function()
	{
		var that = {};
		
		that.create = function(board)
		{
			if(typeof board === 'undefined')
				board = BoardFactory.create();

			return Object.create(Engine).init(board);
		};

		return that;
	})();
// end scope wrapper
})();
