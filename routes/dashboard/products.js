// Importing the dependancies.
const express = require('express'),
	mysql = require('mysql'),
	database = require('../../helpers/database'),
	getCopyrightDate = require('../../helpers/copyright'),
	formater = require('../../helpers/formater'),
	login = require('./../../helpers/login'),
	async = require('async'),
	conn = mysql.createConnection({
		database: database.name,
		host: database.host,
		password: database.password,
		user: database.user,
		multipleStatements: true
	}),
	router = express.Router();

// Connecting to the database.
conn.connect();

// Using the login middleware.
router.use(login);

// Setting up the products route.
router.get('/', function(req, res) {
	conn.query(
		'\
        SELECT `PrimaryNumber`, `SecondaryNumber`, `FixedNumber`, `Email`, `Facebook`, `Instagram`, `Youtube` FROM `Config`;\
        SELECT * FROM `Categories`;\
        SELECT COUNT(`MailID`) AS `NewMail` FROM `Mail` WHERE `Read` = 0;\
        SELECT DISTINCT `P`.`ProductID`, `P`.`ProductName`, `P`.`AddedDate`, `C`.`CategoryName`, (SELECT SUM(`PVF`.`Quantity`) FROM `ProductsVariants` `PV` INNER JOIN `ProductsVariantsFlavors` `PVF` ON `PV`.`VariantID` = `PVF`.`VariantID` WHERE `PV`.`ProductID` = `P`.`ProductID`) AS `Quantity` FROM `Products` `P` INNER JOIN `Categories` `C` ON `P`.`CategoryID` = `C`.`CategoryID` ORDER BY `P`.`AddedDate` DESC;\
        SELECT `C`.*, `P`.`CategoryName` AS `CategoryParentName` FROM `Categories` `C` LEFT JOIN `Categories` `P` ON `C`.`CategoryParent` = `P`.`CategoryID` WHERE `C`.`Deleted` = 0 AND (`P`.`Deleted` = 0 OR `P`.`Deleted` IS NULL) ORDER BY `C`.`CategoryParent`, `C`.`CategoryName`; \
        SELECT * FROM `Brands` WHERE `Deleted` = 0 ORDER BY `BrandName` ASC;\
        SELECT * FROM `Flavors` WHERE `Deleted` = 0 ORDER BY `FlavorName` ASC;\
    ',
		(error, results) => {
			// Checking if there are any errors.
			if (error) throw error;

			// Getting the data.
			const data = {
				Config: {
					Phone: {
						Primary: results[0][0].PrimaryNumber,
						Secondary: results[0][0].SecondaryNumber,
						Fixed: results[0][0].FixedNumber
					},
					Email: results[0][0].Email,
					Facebook: {
						Name: results[0][0].Facebook.split('|')[0],
						Link: results[0][0].Facebook.split('|')[1]
					},
					Instagram: {
						Name: results[0][0].Instagram.split('|')[0],
						Link: results[0][0].Instagram.split('|')[1]
					},
					Youtube: {
						Name: results[0][0].Youtube.split('|')[0],
						Link: results[0][0].Youtube.split('|')[1]
					}
				},
				Categories: formater.groupCategories(results[1]),
				NewMail: results[2][0].NewMail,
				Products: results[3],
				CategoriesData: formater.groupCategories(results[4]),
				Brands: results[5],
				Flavors: results[6],
				FlavorsJSON: JSON.stringify(results[6])
			};

			// Getting the proper copyright date.
			data.CopyrightDate = getCopyrightDate();

			// Rendering the products page.
			res.render('dashboard/products', {
				Data: data
			});
		}
	);
});

// Setting up the product retrieval route.
router.get('/:productID', function(req, res) {
	const stmt = conn.format(
		'\
    SELECT * FROM ?? WHERE ?? = ?;\
    SELECT ??.??, ??.??, ??.??, (SELECT ??.?? From ProductsPriceHistory ?? WHERE ??.?? = ??.?? ORDER BY ??.?? DESC LIMIT 1) AS ?? FROM ?? ?? WHERE ??.?? = ?;\
    SELECT ??.??, ??.??, ??.??, ??.?? FROM ?? ?? INNER JOIN ?? ?? ON ??.?? = ??.?? WHERE ??.?? = ?;\
  ',
		[
			// Meta data.
			'Products',
			'ProductID',
			req.params['productID'],
			// Stock data
			'PV',
			'VariantID',
			'PV',
			'Weight',
			'PV',
			'FeaturedVariant',
			'PPH',
			'Price',
			'PPH',
			'PPH',
			'VariantID',
			'PV',
			'VariantID',
			'PPH',
			'ChangedDate',
			'Price',
			'ProductsVariants',
			'PV',
			'PV',
			'ProductID',
			req.params['productID'],
			// Flavors data.
			'PVF',
			'VariantID',
			'PVF',
			'FlavorID',
			'PVF',
			'Quantity',
			'PVF',
			'VariantImage',
			'ProductsVariantsFlavors',
			'PVF',
			'ProductsVariants',
			'PV',
			'PVF',
			'VariantID',
			'PV',
			'VariantID',
			'PV',
			'ProductID',
			req.params['productID']
		]
	);
	conn.query(stmt, (error, results) => {
		// Checking if there are any errors.
		if (error) throw error;

		// Rendering the products page.
		res.json(results);
	});
});

// Setting the product creation route.
router.post('/', function(req, res) {
	var stmt = conn.format(
		'INSERT INTO ?? (??, ??, ??, ??, ??, ??, ??, ??, ??) VALUES (?, ?, ?, ?, ?, NOW(), ?, ?, 0);',
		[
			'Products',
			'ProductName',
			'NutritionInfo',
			'Description',
			'Usage',
			'Warning',
			'AddedDate',
			'CategoryID',
			'BrandID',
			'Deleted',
			req.body['Name'],
			req.body['NutritionInfo'],
			req.body['Description'],
			req.body['Usage'],
			req.body['Warning'],
			req.body['CategoryID'],
			req.body['BrandID']
		]
	);

	conn.query(stmt, function(errors, results) {
		// Checking if there are any errors.
		if (errors) throw errors;

		if (req.body['Stock']) {
			async.each(req.body['Stock'], function(productStock) {
				var variantStmt = conn.format(
					'INSERT INTO ?? (??, ??, ??, ??) VALUES (?, ?, ?, 0);',
					[
						'ProductsVariants',
						'ProductID',
						'Weight',
						'FeaturedVariant',
						'Deleted',
						results.insertId,
						productStock['Weight'],
						productStock['FeaturedVariant'] == 'true' ? 1 : 0
					]
				);

				conn.query(variantStmt, function(variantErrors, variantResults) {
					// Checking if there are any errors.
					if (variantErrors) throw variantErrors;

					async.each(productStock['Flavors'], function(stockFlavor) {
						var flavorsStmt = conn.format(
							'INSERT INTO ?? (??, ??, ??, ??, ??) VALUES (?, ?, ?, ?, 0);',
							[
								'ProductsVariantsFlavors',
								'VariantID',
								'VariantImage',
								'Quantity',
								'FlavorID',
								'Deleted',
								variantResults.insertId,
								stockFlavor['VariantImage'],
								stockFlavor['Quantity'],
								stockFlavor['FlavorID']
							]
						);

						conn.query(flavorsStmt, function(flavorsErrors, flavorsResults) {
							// Checking if there are any errors.
							if (flavorsErrors) throw flavorsErrors;
						});
					});

					var priceStmt = conn.format(
						'INSERT INTO ?? (??, ??, ??) VALUES (?, ?, NOW());',
						[
							'ProductsPriceHistory',
							'VariantID',
							'Price',
							'ChangedDate',
							variantResults.insertId,
							productStock['Price']
						]
					);

					conn.query(priceStmt, function(priceStmt, priceResults) {
						// Checking if there are any errors.
						if (priceStmt) throw priceStmt;
					});
				});
			});
		}

		// Signalung the client.
		res.send();
	});
});

// Setting up the product edition route.
router.put('/', function(req, res) {
	var stmt = conn.format(
		'UPDATE ?? SET ?? = ?, ?? = ?, ?? = ?, ?? = ?, ?? = ?, ?? = ?, ?? = ? WHERE ?? = ?;',
		[
			'Products',
			'ProductName',
			req.body['Name'],
			'NutritionInfo',
			req.body['NutritionInfo'],
			'BrandID',
			req.body['BrandID'],
			'CategoryID',
			req.body['CategoryID'],
			'Description',
			req.body['Description'],
			'Warning',
			req.body['Warning'],
			'Usage',
			req.body['Usage'],
			'ProductID',
			req.body['ID']
		]
	);

	conn.query(stmt, function(errors, results) {
		// Checking if there are any errors.
		if (errors) throw errors;

		if (req.body['Stock']) {
			var update = req.body['Stock'].filter(function(stk) {
					if (parseInt(stk.VariantID) !== 0) {
						return true;
					} else {
						return false;
					}
				}),
				insert = req.body['Stock'].filter(function(stk) {
					if (parseInt(stk.VariantID) === 0) {
						return true;
					} else {
						return false;
					}
				});

			// Updates.
			async.each(update, function(upStock) {
				var stockUpdateStmt = conn.format(
					'UPDATE ?? SET ?? = ? WHERE ?? = ?;',
					[
						'ProductsVariants',
						'FeaturedVariant',
						upStock['FeaturedVariant'] == 'true' ? 1 : 0,
						'VariantID',
						upStock['VariantID']
					]
				);

				conn.query(stockUpdateStmt, function(
					stockUpdateErrors,
					stockUpdateResults
				) {
					// Checking if there are any errors.
					if (stockUpdateErrors) throw stockUpdateErrors;

					var stockPriceCheckStmt = conn.format(
						'SELECT ?? FROM ?? WHERE ?? = ? ORDER BY ?? DESC LIMIT 1;',
						[
							'Price',
							'ProductsPriceHistory',
							'VariantID',
							upStock['VariantID'],
							'ChangedDate'
						]
					);

					conn.query(stockPriceCheckStmt, function(
						stockPriceCheckErrors,
						stockPriceCheckResults
					) {
						// Checking if there are any errors.
						if (stockPriceCheckErrors) throw stockPriceCheckErrors;

						if (stockPriceCheckResults[0].Price != upStock['Price']) {
							var stockPriceStmt = conn.format(
								'INSERT INTO ?? (??, ??, ??) VALUES (?, ?, NOW());',
								[
									'ProductsPriceHistory',
									'VariantID',
									'Price',
									'ChangedDate',
									upStock['VariantID'],
									upStock['Price']
								]
							);

							conn.query(stockPriceStmt, function(
								stockPriceErrors,
								stockPriceResults
							) {
								// Checking if there are any errors.
								if (stockPriceErrors) throw stockPriceErrors;
							});
						}
					});

					async.each(upStock['Flavors'], function(flv) {
						if (flv['VariantID']) {
							var flavorUpdateStmt = conn.format(
								'UPDATE ?? SET ?? = ?, ?? = ? WHERE ?? = ? AND ?? = ?',
								[
									'ProductsVariantsFlavors',
									'VariantImage',
									flv['VariantImage'],
									'Quantity',
									flv['Quantity'],
									'VariantID',
									flv['VariantID'],
									'FlavorID',
									flv['FlavorID']
								]
							);

							conn.query(flavorUpdateStmt, function(
								flavorUpdateErrors,
								flavorUpdateResults
							) {
								// Checking if there are any errors.
								if (flavorUpdateErrors) throw flavorUpdateErrors;
							});
						} else {
							var flavorInsertStmt = conn.format(
								'INSERT INTO ?? (??, ??, ??, ??) VALUES (?, ?, ?, ?);',
								[
									'ProductsVariantsFlavors',
									'VariantID',
									'VariantImage',
									'Quantity',
									'FlavorID',
									upStock['VariantID'],
									flv['VariantImage'],
									flv['Quantity'],
									flv['FlavorID']
								]
							);

							conn.query(flavorInsertStmt, function(
								flavorInsertErrors,
								flavorInsertResults
							) {
								// Checking if there are any errors.
								if (flavorInsertErrors) throw flavorInsertErrors;
							});
						}
					});
				});
			});

			// Insertions.
			async.each(insert, function(inStock) {
				var stockInsertStmt = conn.format(
					'INSERT INTO ?? (??, ??, ??) VALUES (?, ?, ?);',
					[
						'ProductsVariants',
						'ProductID',
						'Weight',
						'FeaturedVariant',
						req.body['ID'],
						inStock['Weight'],
						inStock['FeaturedVariant'] == 'true' ? 1 : 0
					]
				);

				conn.query(stockInsertStmt, function(
					stockInsertErrors,
					stockInsertResults
				) {
					// Checking if there are any errors.
					if (stockInsertErrors) throw stockInsertErrors;

					var stockPriceStmt = conn.format(
						'INSERT INTO ?? (??, ??, ??) VALUES (?, ?, NOW());',
						[
							'ProductsPriceHistory',
							'VariantID',
							'Price',
							'ChangedDate',
							stockInsertResults.insertId,
							inStock['Price']
						]
					);

					conn.query(stockPriceStmt, function(
						stockPriceErrors,
						stockPriceResults
					) {
						// Checking if there are any errors.
						if (stockPriceErrors) throw stockPriceErrors;
					});
				});
			});
		}

		// Signaling the client.
		res.send();
	});
});

// Exporting the route.
module.exports = router;
