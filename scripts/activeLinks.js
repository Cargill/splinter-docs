// Set the active links in the navbar, left sidebar, and left
// sidebar's version dropdown
function setActiveLinks() {
    $(document).ready(function () {
        var navbar_links = $('.navbar-nav a').filter(function() {
            return window.location.pathname.startsWith(this.getAttribute("href"));
        }).addClass('active');
        $(getElementWithLongestPath(navbar_links)).addClass('active');

        var left_sidebar_links = $('.left-sidebar-group a').filter(function() {
            return window.location.pathname.startsWith(this.getAttribute("href"));
        });
        $(getElementWithLongestPath(left_sidebar_links)).addClass('active');

        var dropdown_links = $('#left-sidebar .dropdown-item').filter(function() {
            return window.location.pathname.startsWith(this.getAttribute("href"));
        }).addClass('active');
        $(getElementWithLongestPath(dropdown_links)).addClass('active');
    });
}

function getElementWithLongestPath(elements) {
    var longest_path = elements.get(0);
    for (var i = 1; i < elements.length; i++) {
        if (elements.get(i).getAttribute("href").length > longest_path.getAttribute("href").length) {
            longest_path = elements.get(i);
        }
    }
    return longest_path;
}
