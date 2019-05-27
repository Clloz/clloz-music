//EventCenter
var EventCenter = (function () {
    function on(type, handler) {
        $(document).on(type, handler)
    }

    function fire(type, data) {
        $(document).trigger(type, data)
    }

    return {
        on: on,
        fire: fire
    }
})(jQuery, window)

//Footer album
var Footer = (function ($, window) {
    //变量声明
    var $footer = $('footer')
    var $leftBtn = $footer.find('.fa-chevron-left')
    var $rightBtn = $footer.find('.fa-chevron-right')
    var $ul_wrap = $footer.find('.ul-wrap')
    var $ul = $footer.find('.ul-wrap ul')
    var wrap_w = $ul_wrap.width() //wrap宽度
    var li_w = 0; //li 宽度
    var count = 0; //总数目
    var page_count = 0; //单页数目
    var animate_lock = false;
    

    //绑定事件
    function bind() {
        $leftBtn.on('click', function () {
            if (animate_lock) return;
            var page_w = li_w * page_count
            var left = parseFloat($ul.css('left'))
            if (left > 0) {
                return;
            } else {
                animate_lock = true;
                $ul.animate({
                    left: '+=' + page_w
                }, 400, function () {
                    animate_lock = false
                })
            }
        })

        $rightBtn.on('click', function () {
            if (animate_lock) return;
            var left = parseFloat($ul.css('left'))
            if (left <= (wrap_w - li_w * count)) {
                return;
            } else {
                animate_lock = true;
                $ul.animate({
                    left: '-=' + (li_w * page_count)
                }, 400, function () {
                    animate_lock = false;
                })
            }
        })

        $ul.on('click', 'li', function () {
            $(this).addClass('active')
                .siblings().removeClass('active')
            EventCenter.fire('select-album', {
                channelId: $(this).attr('data-channel-id'),
                tags: $(this).attr('data-tags')
            })
        })
    }

    //生成元素
    function build(channels) {
        channels.forEach(function (channel) {
            var html = `
            <li data-channel-id="${channel.channel_id}" data-tags="${channel.name}">
                <div class="cate">
                <img class="avatar" src="${channel.cover_small}" alt="" />
                <h3>${channel.name}</h3>
                </div>
            </li>
            `
            $ul.append($(html))
        })

        setUlWidth()
        // console.log($ul.find('li'))
        // $($ul.find('li')[0]).trigger('click')
    }

    //渲染元素
    function render() {
        $.getJSON('https://jirenguapi.applinzi.com/fm/getChannels.php')
            .done(function (data) {
                build(data.channels)
            })
            .fail(function (err) {
                // console.log(err)
            })
    }

    //设置ul宽度
    function setUlWidth() {
        li_w = $ul.find('li').outerWidth(true)
        count = $ul.find('li').length
        page_count = parseInt(wrap_w / li_w)
        $ul.width(li_w * count)
    }

    function init() {
        render()
        bind()
    }

    return {
        init: init
    }
})(jQuery, window)

var FM = (function () {
    //变量声明
    var $main = $('main')
    var channelId = 'public_tuijian_autumn'
    var tags = '秋日私语'
    var sid = ''
    var lyricObj = {}
    var audio = new Audio()
    audio.volume = 0.3
    audio.src = 'http://zhangmenshiting.qianqian.com/data2/music/a9d065243463f3cdaad8dc66b214d150/599483246/599483246.mp3?xcode=4ea9cc954466e75f6a37d80a2c02fc5b'

    //事件绑定
    function bind() {
        EventCenter.on('select-album', throttle(function (data) {
            // console.log(data)
            channelId = data[1].channelId
            tags = data[1].tags
            // console.log(channelId, tags)
            loadMusic(setMusic)
        }))

        // EventCenter.on('select-album', function (e, data) {
        //     console.log(data)
        //     channelId = data.channelId
        //     tags = data.tags
        //     console.log(channelId, tags)
        //     loadMusic(setMusic)
        // })

        $main.find('.actions .btn-play').on('click', function () {
            if ($(this).hasClass('fa-play')) {
                audio.play()
                $(this).removeClass('fa-play').addClass('fa-pause')
            } else {
                audio.pause()
                $(this).removeClass('fa-pause').addClass('fa-play')
            }
        })

        $main.find('.actions .btn-next').on('click', function () {
            loadMusic(setMusic)
        })

        $main.find('.actions .btn-like').on('click', function () {
            if ($(this).hasClass('fa-heart-o')) {
                $(this).removeClass('fa-heart-o').addClass('fa-heart')
            } else {
                $(this).removeClass('fa-heart').addClass('fa-heart-o')
            }
        })

        audio.oncanplay = function () {
            duration = audio.duration;
            var minute = parseInt(audio.duration / 60)
            var second = parseInt(audio.duration % 60)
            minute = minute < 10 ? `0` + minute : minute;
            second = second < 10 ? `0` + second : second;
            if (audio.currentTime === 0) {
            $main.find('.progress').attr('data-time', `00:00/` + minute + `:` + second);
            }
        }

        audio.ontimeupdate = function () {
            var minute_d = parseInt(audio.duration / 60);
            var second_d = parseInt(audio.duration % 60);
            var minute = parseInt(audio.currentTime / 60);
            var second = parseInt(audio.currentTime % 60);
            minute_d = minute_d < 10 ? `0` + minute_d : minute_d;
            second_d = second_d < 10 ? `0` + second_d : second_d;
            minute = minute < 10 ? `0` + minute : minute;
            second = second < 10 ? `0` + second : second;
            if (audio.currentTime >= 1) {
                $main.find('.progress').attr('data-time', minute + `:` + second + `/` + minute_d + `:` + second_d)
                $main.find('.progress .cur').width(parseFloat(audio.currentTime / audio.duration) * 100 + '%')
            }
            var time = minute + ':' + second
            if (lyricObj[time]) {
                // console.log(lyricObj[time])
                $('.detail .lyric p').text(lyricObj[time])
                $('.detail .lyric p').boomText('rollIn')
            }
        }

        audio.onended = function () {
            $main.find('.actions .btn-next').trigger('click')
        }
    }

    //获取音乐信息
    function loadMusic(callback) {
        $.getJSON('https://jirenguapi.applinzi.com/fm/getSong.php', {
            channel: channelId
        })
            .done(function (data) {
                // console.log(data)
                $main.find('.progress .cur').width(0)
                sid = data.song[0].sid
                callback(data.song[0])
                loadLyric()
            })
            .fail(function (err) {
                // console.log(err)
            })
    }

    //函数节流
    function throttle(fn) {
        var throttle = false;
        return function () {
            if (throttle) return;
            throttle = true;
            setTimeout(() => {
                // console.log(this, arguments)
                fn.call(this, arguments)
                throttle = false
            }, 100)
        }
    }

    //获取歌词
    function loadLyric() {
        $.getJSON('https://jirenguapi.applinzi.com/fm/getLyric.php', {
            sid: sid
        })
            .done(function (data) {
                var lyric = data.lyric
                var arr = lyric.split('\n')
                arr.forEach(function (line) {
                    var key = line.match(/\d{2}:\d{2}/g)
                    var value = line.replace(/\[\d{2}:\d{2}\.\d{2}\]/g, '')
                    if (Array.isArray(key)) {
                        key.forEach(function (time) {
                            lyricObj[time] = value;
                        })
                    }
                })
                console.log(lyricObj)
            })
    }

    //设置音乐信息
    function setMusic(data) {
        //音乐播放
        // console.log(data)
        audio.src = data.url
        audio.play()
        
        if ($main.find('.actions .btn-play').hasClass('fa-play')) {
            $main.find('.actions .btn-play').removeClass('fa-play').addClass('fa-pause')
        }

        //设置背景和封面
        $('.cover').css('background-image', `url("${data.picture}")`)
        $main.find('.avatar').attr('src', data.picture)
        $main.find('.detail .title .name').text(data.title)
        $main.find('.detail .title .artist').text(data.artist)
        $main.find('.detail .tags').text(tags)
        titleScroll()
    }

    function titleScroll() {
        var wrap_width = $('.layout .detail .title').width();
        var title_width = $('.detail .title .name').width() + $('.detail .title .artist').width();
        if (title_width > wrap_width) {
            $(".detail .title h1").addClass("animate");
        } else {
            $(".detail .title h1").removeClass("animate");
        }
    }

    //初始化
    function init() {
        bind()
    }

    return {
        init: init
    }
})(jQuery, window)

Footer.init()
FM.init()

var wrap_width = $('.layout .detail .title').width();
var title_width = $('.detail .title .name').width() + $('.detail .title .artist').width();
if (title_width > wrap_width) {
    $(".detail .title h1").addClass("animate");
} else {
    $(".detail .title h1").removeClass("animate");
}