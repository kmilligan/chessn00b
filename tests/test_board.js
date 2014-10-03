// tests for our "board.js" file
$.getScript('../board.js', function()
{
	test("CreateBoard", testCreateBoard);
	test("FEN", testFEN);
	test("SimpleCoverage", testSimpleCoverage);
	test("LessSimpleCoverage", testLessSimpleCoverage);
	test("SimpleValidMoves", testSimpleValidMoves);
	test("ComplexValidMoves", testComplexValidMoves);
	test("FindPiece", testFindPiece);
	test("SquareAttacked", testIsSquareAttacked);
	test("InCheck", testInCheck);
	test("InCheckmate", testInCheckmate);
	test("StaticPieceValue", testStaticPieceValue);
	test("DynamicPieceValue", testDynamicPieceValue);
	test("SimpleMove", testSimpleMove);
	test("SimpleBestMove", testSimpleBestMove);
	test("2PlyBestMove", test2PlyBestMove);
	test("Timing", testTiming);
});

var testCreateBoard = function()
{
	var board = BoardFactory.create();

	// a8, h1 are white
	ok(board.getSquare(1,8).isWhite());
	ok(board.getSquare(8,1).isWhite());

	// a1, h8 are black
	ok(!board.getSquare(1,1).isWhite());
	ok(!board.getSquare(8,8).isWhite());

	// try using algebraic
	ok(board.getSquare('a8').isWhite());
	ok(board.getSquare('h1').isWhite());
	ok(!board.getSquare('a1').isWhite());
	ok(!board.getSquare('h8').isWhite());
};

var testFEN = function()
{
	var board = BoardFactory.create();
	
	// standard starting board
	var fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
	
	board.setFEN(fen);
	equal(board.getSquare(4,1).getPiece(), 'Q');
	equal(board.getSquare(4,8).getPiece(), 'q');
	ok(board.isWhiteToMove());

	equal(board.getPositionFEN(), 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR');
};

var testSimpleCoverage = function()
{
	var board = BoardFactory.create();
	board.setFEN('k7/8/8/8/8/8/1K6/8 w - 0 1');	
	equal(board.getSquare(1,8).getPiece(), 'k');
	equal(board.getSquare(2,2).getPiece(), 'K');

	var coverageWhite = board.getWhitesCoveredSquares();
	equal(coverageWhite.length, 8);

	var coverageBlack = board.getBlacksCoveredSquares();
	equal(coverageBlack.length, 3);
	
	board.setFEN('q7/8/8/8/8/8/1Q6/8 w - 0 1');	
	equal(board.getSquare(1,8).getPiece(), 'q');
	equal(board.getSquare(2,2).getPiece(), 'Q');

	var coverageWhite = board.getWhitesCoveredSquares();
	equal(coverageWhite.length, 23);

	var coverageBlack = board.getBlacksCoveredSquares();
	equal(coverageBlack.length, 21);

	board.setFEN('r7/8/8/8/8/8/1R6/8 w - 0 1');	
	var coverageWhite = board.getWhitesCoveredSquares();
	equal(coverageWhite.length, 14);
	var coverageBlack = board.getBlacksCoveredSquares();
	equal(coverageBlack.length, 14);

	board.setFEN('b7/8/8/8/8/8/1B6/8 w - 0 1');	
	var coverageWhite = board.getWhitesCoveredSquares();
	equal(coverageWhite.length, 9);
	var coverageBlack = board.getBlacksCoveredSquares();
	equal(coverageBlack.length, 7);

	board.setFEN('n7/8/8/8/8/8/1N6/8 w - 0 1');	
	var coverageWhite = board.getWhitesCoveredSquares();
	equal(coverageWhite.length, 4);
	var coverageBlack = board.getBlacksCoveredSquares();
	equal(coverageBlack.length, 2);
	
	board.setFEN('p7/8/8/8/8/8/1P6/8 w - 0 1');	
	var coverageWhite = board.getWhitesCoveredSquares();
	equal(coverageWhite.length, 2);
	var coverageBlack = board.getBlacksCoveredSquares();
	equal(coverageBlack.length, 1);
};

var testLessSimpleCoverage = function()
{
	// king coverage shouldn't change, but others should add
	var board = BoardFactory.create();
	board.setFEN('kp6/8/8/8/8/8/PK6/8 w - 0 1');	
	equal(board.getSquare(1,8).getPiece(), 'k');
	equal(board.getSquare(2,2).getPiece(), 'K');

	var coverageWhite = board.getWhitesCoveredSquares();
	equal(coverageWhite.length, 9);

	var coverageBlack = board.getBlacksCoveredSquares();
	equal(coverageBlack.length, 5);

	// Queens are now blocked, reducing scope
	board.setFEN('qp6/8/8/8/8/1P6/1QP5/8 w - 0 1');	
	equal(board.getSquare(1,8).getPiece(), 'q');
	equal(board.getSquare(2,2).getPiece(), 'Q');

	var coverageWhite = board.getWhitesCoveredSquares();
	equal(coverageWhite.length, 17);

	var coverageBlack = board.getBlacksCoveredSquares();
	equal(coverageBlack.length, 17);

	// knights remain unaffected
	board.setFEN('n7/8/1r6/8/8/8/1N6/8 w - 0 1');	
	var coverageWhite = board.getWhitesCoveredSquares();
	equal(coverageWhite.length, 4);
	var coverageBlack = board.getBlacksCoveredSquares();
	equal(coverageBlack.length, 15);
};

var testSimpleValidMoves = function()
{
	var board = BoardFactory.create();
	board.setFEN('kp6/8/8/8/8/r7/PK6/8 w - 0 1');	
	equal(board.getSquare(1,8).getPiece(), 'k');
	equal(board.getSquare(2,2).getPiece(), 'K');

	equal(board.getValidMovesForSquare(1,8).length, 2);

	// king can't move into check! but can take the rook...
	ok(board.isSquareAttackedByBlack(board.getSquare(2,3)));
	equal(board.getValidMovesForSquare(2,2).length, 5);

	// ...unless it's protected
	board.setFEN('kp6/8/8/8/1p6/r7/PK6/8 w - 0 1');	
	equal(board.getValidMovesForSquare(2,2).length, 4);
};

var testComplexValidMoves = function()
{
	var board = BoardFactory.create();
	board.setFEN('8/8/8/8/8/1P6/P7/8 w - 0 1');	

	// pawns can move two on first move!
	equal(board.getValidMovesForSquare(2,3).length, 1);
	equal(board.getValidMovesForSquare(1,2).length, 2);

	// piece can't move if it would put king in check!
	board.setFEN('8/8/8/8/p7/1r6/1Q6/1K6 w - 0 1');
	// ...but can still take rook, even tho protected!
	equal(board.getValidMovesForSquare(2,2).length, 1);
};

var testFindPiece = function()
{
	var board = BoardFactory.create();
	board.setFEN('kp6/8/8/8/8/8/PK6/8 w - 0 1');	

	equal(board.findPiece('K')[0].getPiece(), 'K');
	equal(board.findPiece('k')[0].getPiece(), 'k');
};

var testIsSquareAttacked = function()
{
	var board = BoardFactory.create();
	board.setFEN('kp6/8/8/8/8/8/PK6/8 w - 0 1');	
	ok(!board.isSquareAttacked(board.findPiece('K')[0]));
	ok(!board.isSquareAttacked(board.findPiece('k')[0]));

	// black king protected, white not
	board.setFEN('kp5R/8/8/8/8/q7/PK6/8 w - 0 1');	
	//board.dump();
	ok(board.isSquareAttacked(board.findPiece('K')[0]));
	ok(!board.isSquareAttacked(board.findPiece('k')[0]));

	// can't protect against the knight!
	board.setFEN('kp6/2N5/8/8/1q6/1P6/PK6/8 w - 0 1');	
	ok(!board.isSquareAttacked(board.findPiece('K')[0]));
	ok(board.isSquareAttacked(board.findPiece('k')[0]));
};

var testInCheck = function()
{
	// have to take into account
	// a) being attacked
	// b) who has the move? shouldn't matter?

	var board = BoardFactory.create();
	board.setFEN('kp6/8/8/8/8/8/PK6/8 w - 0 1');	
	ok(!board.blackInCheck());	
	ok(!board.whiteInCheck());	

	board.setFEN('kp6/1q6/8/8/8/8/PK6/8 w - 0 1');	
	ok(!board.blackInCheck());	
	ok(board.whiteInCheck());	
};

var testInCheckmate = function()
{
	var board = BoardFactory.create();
	board.setFEN('kp6/8/8/8/8/8/PK6/8 w - 0 1');	
	ok(!board.blackInCheckmate());	
	ok(!board.whiteInCheckmate());	

	board.setFEN('kp6/1q6/8/8/8/8/PK6/8 w - 0 1');	
	ok(!board.blackInCheckmate());	
	ok(!board.whiteInCheckmate());	

	board.setFEN('8/8/8/8/8/1k6/1q6/1K6 w - 0 1');	
	ok(board.whiteInCheckmate());	

	// this one is trickier because a1 is not *currently* covered
	// but *would be* if the King wanted to go there.
	board.setFEN('8/8/8/8/1k6/2q5/PK6/1R6 w - 0 1');	
	equal(board.getValidMovesForSquare(2,2).length, 0);
	ok(board.whiteInCheckmate());	
};

var testStaticPieceValue = function()
{
	var board = BoardFactory.create();
	board.setFEN('rnbqk3/8/8/8/8/8/PPPPP3/RNBQK3 w - 0 1');	
	equal(board.getWhiteStaticValue(), 250);	
	equal(board.getBlackStaticValue(), 200);	
};

var testDynamicPieceValue = function()
{
	var board = BoardFactory.create();
	board.setFEN('2b1kb2/8/8/8/8/8/8/3QK3 w - 0 1');	
	equal(board.getWhiteDynamicValue(), 23);	
	equal(board.getBlackDynamicValue(), 29);	
};

var testSimpleMove = function()
{
	var board = BoardFactory.create();
	board.setFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
	ok(board.move('e2e4'));
	equal(board.getPositionFEN(), 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR');

	board.setFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
	ok(board.moves('e2e4 c7c5 g1f3'));
	equal(board.getPositionFEN(), 'rnbqkbnr/pp1ppppp/8/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R');
};

var testSimpleBestMove = function()
{
	var board = BoardFactory.create();
	board.setFEN('5q2/6r1/8/8/8/8/7K/8 b - 0 1');
	equal(board.getBestMoveForBlack(), 'f8h8');

	board.setFEN('q7/5p2/6R1/8/8/8/8/8 b - 0 1');
	equal(board.getBestMoveForBlack(), 'f7g6');
	
	board.setFEN('8/6p1/q5R1/8/8/8/8/8 w - 0 1');
	equal(board.getBestMoveForWhite(), 'g6a6');
};

var test2PlyBestMove = function()
{
	var board = BoardFactory.create();
	// have a choice...take the queen (and lose next turn)
	// or take the bishop
	board.setFEN('8/p7/1q/1R5b/8/8/8/8 w - 0 1');
	equal(board.getBestMoveForWhite(), 'b5h5');
};

var testTiming = function()
{
	// let see how slow clone is.
	var board = BoardFactory.create();
	var fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
	board.setFEN(fen);

	var clone;
	var numCopies = 2000;
	var start = new Date().getTime();
	for(var i = 0; i < numCopies; i++)
		clone = board.clone();

	var end = new Date().getTime();

	console.log((end - start) + 'ms makin ' + numCopies + ' copies');
	ok(true);

	// maybe it's determineValid?
	var start = new Date().getTime();
	for(var i = 0; i < numCopies; i++)
	{
		clone.determineValidMoves(true);
		clone.resetCaches();
	}

	var end = new Date().getTime();

	console.log((end - start) + 'ms makin ' + numCopies + ' determineValidMoves');
	ok(true);
};
