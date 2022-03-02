import requests


def log_request(r, api):
    f = open("logs.txt", "a")
    text = "GET " + api + ": " + str(r.request) + ", " + str(r.reason) + ", " + str(r.elapsed.total_seconds()) + "\n"
    f.write(text)
    f.close()


def get_random_number(mmax):
    URL = "https://csrng.net/csrng/csrng.php"
    param = {
        'max': str(mmax)
    }
    r = requests.get(url=URL, params=param)
    data = r.json()
    log_request(r, "csrng")
    while data[0]['status'] == 'error':
        r = requests.get(url=URL, params=param)
        data = r.json()
        log_request(r, "csrng")

    return int(data[0]['random'])


def get_random_movie():
    file1 = open('config.txt', 'r')
    Lines = file1.readlines()
    key = Lines[0].strip()
    file1.close()
    URL = "https://api.themoviedb.org/3/movie/"
    param = {
        'api_key': key,
        'page': get_random_number(499)
    }

    r = requests.get(url=URL + "popular", params=param)
    data = r.json()
    log_request(r, "themoviedb")
    while r.status_code != 200:
        r = requests.get(url=URL + "popular", params=param)
        data = r.json()
        log_request(r, "themoviedb")
    movie_id = get_random_number(len(data) - 1)
    log_request(r, "themoviedb")
    return data['results'][movie_id]['title']


def get_youtube_link():
    file1 = open('config.txt', 'r')
    Lines = file1.readlines()
    key = Lines[1].strip()
    file1.close()
    URL = "https://www.googleapis.com/youtube/v3/search"

    movie_title = get_random_movie()
    param = {
        'part': 'snippet',
        'maxResults': '1',
        'q': movie_title + " trailer",
        'type': 'video',
        'key': key
    }

    r = requests.get(url=URL, params=param)
    data = r.json()
    log_request(r, "youtube API")
    while r.status_code != 200:
        r = requests.get(url=URL, params=param)
        data = r.json()
        log_request(r, "youtube API")

    return "https://www.youtube.com/embed/" + data['items'][0]['id']['videoId']
