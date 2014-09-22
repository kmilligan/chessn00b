// tests for our "board.js" file
$.getScript('../board.js', function()
{
	test("CreateBoard", testCreateBoard);
	test("FEN", testFEN);
	test("SimpleCoverage", testSimpleCoverage);
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
};
