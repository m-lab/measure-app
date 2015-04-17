document.addEventListener('DOMContentLoaded', function() {
    var server = "ndt.iupui.mlab1.nuq0t.measurement-lab.org";
    var port = "3001";
    var path = "/ndt_protocol";
    var NDT_meter,
        NDT_client,
        sheet,
        svgDiv,
        msgTextSize,
        infoTextSize,
        resultsTextSize;

    svgDiv = document.getElementById('svg');

    // Make the font size proportional to the container
    sheet = document.createElement('style');
    msgTextSize = Math.round(svgDiv.offsetWidth * 0.04) + 'px';
    infoTextSize = Math.round(svgDiv.offsetWidth * 0.032) + 'px';
    resultsTextSize = Math.round(svgDiv.offsetWidth * 0.028) + 'px';
    sheet.innerHTML = '#progress-meter {font-size: ' + msgTextSize + ';} ' +
        '#progress-meter .result_value, #progress-meter .result_label ' +
        '{font-size: ' + resultsTextSize + ';} ' +
        '#progress-meter text.information {font-size: ' + infoTextSize + ';}';
    document.head.appendChild(sheet);

    // If the document's body is smaller than the width and height assigned to
    // the #svg div, then adjust the width to fit.
    var bodyWidth = document.body.offsetWidth;
    if (bodyWidth < svgDiv.offsetWidth) {
        svgDiv.style.width = bodyWidth - 5 + 'px';
        svgDiv.style.height = bodyWidth - 5 + 'px';
    }

    NDT_meter = new NDTmeter('#svg');
    NDT_client = new NDTjs(server, port, path, NDT_meter);
    NDT_meter.meter.on("click", function () {
	    NDT_client.startTest();
    });
});
