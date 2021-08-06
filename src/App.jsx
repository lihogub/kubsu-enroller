import './App.css';
import {useEffect, useRef, useState} from "react";
import axios from "axios";
import {findDOMNode} from "react-dom";

const MATHOBES = "http://ftp.kubsu.ru/ranged/02.03.03_792_ofo_b.html"
const INFORM = "http://ftp.kubsu.ru/ranged/09.03.03_793_ofo_b.html"
const FUNDAM = "http://ftp.kubsu.ru/ranged/02.03.02_788_ofo_b.html"
const APPLIED = "http://ftp.kubsu.ru/ranged/01.03.02_790_ofo_b.html"

const DB = {
    common: {},
    commonList: [],
    mathobes: [],
    fundam: [],
    applied: [],
    inform: []
}

const merge = () => {
    console.log("merge")
    DB.mathobes.forEach(u => addToCommon(u, "mathobes"))
    DB.fundam.forEach(u => addToCommon(u, "fundam"))
    DB.applied.forEach(u => addToCommon(u, "applied"))
    DB.inform.forEach(u => addToCommon(u, "inform"))

    Object.entries(DB.common).forEach(
        u => {
            DB.commonList = [...DB.commonList, u[1]]
        }
    )


    DB.commonList = [...new Set(DB.commonList)]
    DB.commonList.sort((a,b) => a.score-b.score ).reverse()
}

const addToCommon = (user, direction) => {
    if (!DB.common.hasOwnProperty(user.id)) {
        DB.common[user.id] = {
            id: user.id,
            score: user.score,
            shown: true
        }
    }
    DB.common[user.id][direction] = user.agree
    DB.common[user.id].score = Math.max(DB.common[user.id].score, user.score)
}

const process = (html, callback, direction) => {
    const regexp = /...-...-... ../g;

    const M = [...html.matchAll(regexp)];

    M.reduce((prev, curr) => {

        let delta = curr.index - prev.index
        let row = html.slice(prev.index+14, prev.index + delta - 200)

        let id = html.slice(prev.index+0, prev.index + 14)
        let score = [...row.matchAll(/(\d)+<\/div>/g)].map(m => {
            return parseInt([...m[0].matchAll(/(\d)+/g)][0][0])
        }).reduce((p, c)=> Math.max(p, c), 0)

        let agree = row.match(/(Есть)|(Нет)/g)[0]

        DB[direction] = [...DB[direction], {
            id: id,
            score: (score < 20) ? Infinity : score,
            agree: (agree === "Есть")
        }]


        return curr
    })
    merge()
    callback(direction)
}

const makeUrl = (url) => {
    return `https://api.codetabs.com/v1/proxy/?quest=${url}`
}

const getData = (url, direction, callback) => {
    axios.get(makeUrl(url))
        .then(r => {
            process(r.data, callback, direction)
        })
}

const stateToString = (state) => {
    if (state)
        return "+"
    else if (state === false)
        return "-"
    else
        return ""
}

const sortBy = (direction, callback) => {
    if (direction === null) {
        DB.commonList.forEach(u=>{
            u.shown = true
        })
    } else {
        DB.commonList.forEach(u => {
            u.shown = u[direction] !== undefined;
        })
    }
    callback(direction)
}

function App() {

    const [lol, useLol] = useState("")

    const [selected, setSelected] = useState(1)

    useEffect(()=>{
        getData(MATHOBES, "mathobes", useLol)
        getData(APPLIED, "applied", useLol)
        getData(INFORM, "inform", useLol)
        getData(FUNDAM, "fundam", useLol)
    }, [])

    console.log(DB)



    const onClick = (direction, directionId) => {
        sortBy(direction, useLol)
        setSelected(directionId)
    }

    const [search, setSearch] = useState("")
    const [searched, setSearched] = useState([])

    useEffect(()=>{
        let _searched = []
        if (search.length > 2)
            _searched = DB.commonList
                .filter(u=>u.id.includes(search))
        setSearched(_searched)
    }, [search])

    useEffect(()=>{
        if (searched.length > 0)
            setTimeout(() => {
                const el = document.getElementById(searched[0].id)
                if (el !== null) el.scrollIntoView({block: "center", behavior:"smooth"})
            })
    }, [lol, searched])

    const tStyle = {
        borderCollapse: "collapse",
        border: "1px solid",
    }

    const selStyle = {
        borderCollapse: "collapse",
        border: "1px solid",
        background: "lightgray",
    }

    const inputStyle = {
        position: "fixed",
        display: "block",
        width: 350,
        height: 30,
        margin: 10,
        fontSize: 16
    }

  return (
    <div className="App">
        <div>
            <input value={search}
                   placeholder={"Искать по СНИЛС"}
                   onChange={(e) => setSearch(e.target.value)} style={inputStyle}/>
        </div>
        <br/>
        <br/>
        <br/>
        <table style={tStyle}>
            <tr>
                <td style={tStyle}>№</td>
                <td style={tStyle}>СНИЛС</td>
                <td style={(selected === 1) ? selStyle : tStyle}>
                    <button children={"БАЛЛЫ"} onClick={()=>onClick(null, 1)} />
                </td>
                <td style={(selected === 2) ? selStyle : tStyle}>
                    <button children={"МОАИС"} onClick={()=>onClick("mathobes", 2)}/>
                </td>
                <td style={(selected === 3) ? selStyle : tStyle}>
                    <button children={"ФИИТ"} onClick={()=>onClick("fundam", 3)}/>
                </td>
                <td style={(selected === 4) ? selStyle : tStyle}>
                    <button children={"ПМИ"} onClick={()=>onClick("applied", 4)}/>
                </td>
                <td style={(selected === 5) ? selStyle : tStyle}>
                    <button children={"ПИ"} onClick={()=>onClick("inform", 5)}/>
                </td>
            </tr>
            {
                DB.commonList
                    .filter(u => u.shown)
                    .map(
                    (u, idx) => (
                        <tr style={(searched.some(t=>t.id===u.id))? selStyle : tStyle} id={u.id} key={u.id}>
                            <td style={tStyle}>{idx+1}</td>
                            <td style={tStyle}>{u.id}</td>
                            <td style={(selected === 1) ? selStyle : tStyle}>{u.score}</td>
                            <td style={(selected === 2) ? selStyle : tStyle}>{stateToString(u.mathobes)}</td>
                            <td style={(selected === 3) ? selStyle : tStyle}>{stateToString(u.fundam)}</td>
                            <td style={(selected === 4) ? selStyle : tStyle}>{stateToString(u.applied)}</td>
                            <td style={(selected === 5) ? selStyle : tStyle}>{stateToString(u.inform)}</td>
                        </tr>
                    )
                )
            }

        </table>
    </div>
  );
}

export default App;
