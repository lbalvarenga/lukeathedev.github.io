// TODO: Change badge color based on score

let cardTemplate = `
<div class="col-auto mb-3">
    <div class="card" style="width: 18rem;">
        <img src="media/{{albumArtwork}}" class="card-img-top" alt="Album Artwork">
        <div class="card-body">
            <a href="{{albumLink}}" target="_blank">
                <h5 class="card-title">{{albumName}} <span class="text-muted">por {{albumArtist}} ({{albumYear}})</span></h5>
            </a>
            <h6>{{albumGenre}}</h6>
            <h5><span class="badge badge-primary">{{albumScore}}/10</span></h5>
            <p class="card-text">{{albumSynopsis}}</p>
            <h6>Top 3</h6>
            <ol class="list-group list-group-flush">
                <li class="list-group-item">
                    <a class="sl-link" href="{{songLink}}" target="_blank">
                        <b>{{songNumber}}.</b> {{songName}}
                    </a>
                    <span class="badge badge-primary">{{songScore}}/10</span>
                </li>
                <li class="list-group-item">
                    <a class="sl-link" href="{{songLink}}" target="_blank">
                        <b>{{songNumber}}.</b> {{songName}}
                    </a>
                    <span class="badge badge-primary">{{songScore}}/10</span>
                </li>
                <li class="list-group-item">
                    <a class="sl-link" href="{{songLink}}" target="_blank">
                        <b>{{songNumber}}.</b> {{songName}}
                    </a>
                    <span class="badge badge-primary">{{songScore}}/10</span>
                </li>
            </ol>
            <p class="card-text"><small class="text-muted">Review: {{reviewDate}}</small></p>
        </div>
    </div>
</div>
`

let card = cardTemplate;
$.getJSON('data/reviews.json', function (data) {
    $.each(data.reviews, function (i, review) {
        $.each(review, function (key, value) {
            let variableName = '{{' + key + '}}';

            // Append songs to Top 3 List
            if (key == 'topSongs') {
                $.each(value, function (key, value) {
                    $.each(value, function (key, value) {
                        let variableName = '{{' + key + '}}'
                        card = card.replace(variableName, value)
                    })
                })
            }

            // Format the date
            if (key == 'reviewDate') {
                var date = new Date(value);
                var dateFormat = { year: 'numeric', month: 'long', day: 'numeric' };
                card = card.replace(variableName, date.toLocaleDateString('pt-BR', dateFormat));
            }

            card = card.replace(variableName, value);
        })
        $('#card-holder').append(card)
        card = cardTemplate;
    })
    
})
