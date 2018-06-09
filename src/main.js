import firebase from 'firebase/app';
import 'firebase/database';
import './setjquery'
import './style.css'
import './semantic/dist/components/transition'
import './semantic/dist/components/dropdown'
import './semantic/dist/components/progress'
import './semantic/dist/components/rating'
import './semantic/dist/components/search'
import './tablesort'
const SectionTemplate = require('./section.ejs')
const CourseTemplate = require('./course.ejs')
const SavedTemplate = require('./saved.ejs')

const app = firebase.initializeApp({
  apiKey: "AIzaSyDVXt-oBg1_o8lb-Dlsl6gvlqKA7gITAUo",
  authDomain: "courseplanme.firebaseapp.com",
  databaseURL: "https://courseplanme.firebaseio.com",
  projectId: "courseplanme",
  storageBucket: "courseplanme.appspot.com",
  messagingSenderId: "758050784913"
});
const database = firebase.database()

function flipIt(element){
  var is = [['grey','radio'],['green','checkmark']]
  var c = element.children[0].children[0].classList
  var its = c.contains(...is[0])
  c.remove(...is[+!its])
  c.add(...is[+its])
  $(element).closest('tr').toggleClass('positive')
}
function runSemantics(){
  $(".rating").rating('disable');
  $(".progress").progress({
    showActivity:false
  });
  $('tr td:first-child').click(function(){
    flipIt(this)
    onSelection(this)
  })
  $('table').tablesort()
  $('#sectionHeader').data('sortBy',(th,td) => {
    return +!td.find('.green').length+'-'+td.text().trim().padStart(3,0)
  })
  $('#ratingHeader').data('sortBy',(tr,td) => {
    return td.find('[data-rating]').attr('data-rating')+String((td.text().match(/\d+/g)||[]).reduce((a,b) => +b+a,0)).padStart(4,0)
  })
}

window._saved = localStorage.saved ? JSON.parse(localStorage.saved) : {}

async function load(semester,courseCode){
  await Promise.all([
    new Promise((res,rej) => {
      database.ref(`sections/${semester}/${courseCode}`).on('value',snapshot => {
        var sections = snapshot.val()
        document.querySelector('tbody').innerHTML = SectionTemplate({sections:sections})
        // Allow access for later
        window._sections = sections
        res()
      },rej)
    }),
    new Promise((res,rej) => {
      database.ref(`courses/${courseCode}`).on('value',snapshot => {
        var course = snapshot.val()
        document.getElementById('course-info').innerHTML = CourseTemplate(course)
        // Allow access for later
        window._course = course
        res()
      },rej)
    }),
  ]).catch(console.error)
  var sections,course
  document.querySelector('.ui.search input').value = ""
  runSemantics()
  updateSaved()
}

async function search(){
  var course = document.querySelector('#search input').value
  var semester = document.querySelector('#semester .selected').dataset.value
  course = course.replace(/\s/g,'').toUpperCase()
  load(semester,course)
}

function initSearch(){
  if(_semester){
    database.ref(`directories/courses/${_semester}`).on('value',snapshot => {
      var parent = document.getElementById('search-container')
      var guts = parent.innerHTML
      parent.innerHTML = ""
      parent.innerHTML = guts
      $('.ui.search').search({
        source: Object.values(snapshot.val()).map(c => ({title:c.code,description:c.title})),
        searchFields:[
          'title','description'
        ],
        onSelect: result => {
          load(_semester,result.title)
        },
      })
    })
  }
}

async function semesterChange(semester){
  window._semester = semester
  updateSaved()
  document.querySelector('tbody').innerHTML = ""
  document.getElementById('course-info').innerHTML = ""
  initSearch()
}
function loadSemesters(){
  window._semester = new Date().getFullYear()+';'+(() => {
    switch(new Date().getMonth()+1){
      case 10:case 11:case 12:case 1:
      return 'WI'
      case 2:case 3:
      return 'SP'
      case 4:case 5:
      return 'SS'
      case 6:case 7:case 8:case 9:
      return 'FA'
    }
  })()
  const calc = ([year,sem]) => year*4 + ['WI','SP','SS','FA'].indexOf(sem)
  const name = ([year,sem]) => ({WI:'Winter',SP:'Spring',SS:'Summer',FA:'Fall'})[sem]+' '+year
  database.ref('/directories/semesters').on('value',snapshot => {
    $('.ui.dropdown').dropdown({
      values:Object.keys(snapshot.val()).map(code => ({
        name: name(code.split(';')),
        value: code,
        selected: code == _semester
      })).sort((a,b) => calc(a.value.split(';')) - calc(b.value.split(';'))),
      onChange: semesterChange,
    })
  })
}
function onSelection(element){
  var section = element.innerText.trim()
  var isAdd = element.parentElement.classList.contains('positive')
  var alreadyExists = _saved[_semester] && _saved[_semester][_course.code] && _saved[_semester][_course.code].sections[section]

  if(isAdd && !alreadyExists){
    // Set up if not already setup
    _saved[_semester] || (_saved[_semester] = {}) 
    _saved[_semester][_course.code] || (_saved[_semester][_course.code] = {course: _course,sections:{}})
    
    _saved[_semester][_course.code].sections[section] = _sections[section]
  } else if(alreadyExists){
    delete _saved[_semester][_course.code].sections[section]
    if(!Object.keys(_saved[_semester][_course.code].sections).length){
      delete _saved[_semester][_course.code]
      if(!Object.keys(_saved[_semester]).length){
        delete _saved[_semester]
      }
    }
  }
  save()
  updateSaved()
}
function save(){
  localStorage.saved = JSON.stringify(_saved)
}
function updateSaved(){
  document.querySelectorAll('td:first-child').forEach(element => {
    var isOn = element.parentElement.classList.contains('positive')
    var section = element.innerText.trim()
    var supposedToBeOn = _saved[_semester] && _saved[_semester][_course.code] && _saved[_semester][_course.code].sections[section]
    if((isOn && !supposedToBeOn) || (!isOn && supposedToBeOn)){
      flipIt(element)
    }
  })
  document.getElementById('saved').innerHTML = SavedTemplate()
}

document.addEventListener("DOMContentLoaded", function(event) { 
  loadSemesters()
  updateSaved()
  window.load = load
});