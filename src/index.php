<?php
session_start();
include_once('libs/skybolt.php');
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="en-US">
<head>
	<title>Skybolt Demo</title>
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<meta name="description" content="Skybolt Technology Demo">
	<base href="<?php echo SITE_ROOT; ?>">
	<?php $skybolt->insertStylesheet('default') ?>
	<?php $skybolt->head() ?>
</head>
<body>
	<?php $skybolt->insertFragment('header') ?>
	<div class="content">
		<div id="main">

			(...content goes here...)

		</div>
	</div>

	<?php $skybolt->insertScript('boot') ?>
	<?php $skybolt->body() ?>
</body>
</html>