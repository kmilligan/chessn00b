// tests for our "board.js" file
$.getScript('../board.js', function()
{
	test("CreateBoard", testCreateBoard);
	test("FEN", testFEN);
	test("SimpleCoverage", testSimpleCoverage);
	test("LessSimpleCoverage", testLessSimpleCoverage);
	test("FindPiece", testFindPiece);
	test("SquareAttacked", testIsSquareAttacked);
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
