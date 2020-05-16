$('#reviewerTronForm').submit(function () {
    let reviewData = $('#reviewerTronForm').serializeArray();
    let review = new Object(); topSong = {}; topSongs = [];

    // Random 8-digit UUID
    review.id = ('' + Math.random()).substring(2, 10);

    for (const element of reviewData) {
        if (element.value == '') {
            alert('Todos os itens devem ser preenchidos.');
            return false;
        }
        if (element.name.includes('song')) {
            topSong[element.name] = element.value;
            if (Object.keys(topSong).length >= 4) {
                topSongs.push(topSong)
                topSong = {};
            }
        }
        else {
            review[element.name] = element.value;
        }
    }
    review['topSongs'] = topSongs;
    review['reviewDate'] = new Date();
    $('#jsonResult').text(JSON.stringify(review))
    return false;
})