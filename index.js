const root = ReactDOM.createRoot(document.querySelector('#root'));
const { useEffect, useState } = React;
const url = `https://fathomless-brushlands-42339.herokuapp.com/todo3`;

// !App
function App() {
  return (
    <TodoPage />
  )
}

// !頁面
function TodoPage() {
  return (
    <div id="todoListPage" className="bg-half">
      <Header />
      <Todo_Container />
    </div>
  )
}

// !第一層 (容器，但有邏輯)

function Header() {
  return (
    <nav>
      <h1><a href="#">ONLINE TODO LIST</a></h1>
    </nav>
  )
}

function Todo_Container() {
  const [data, setData] = useState(null);
  const [tabState, setTabState] = useState('全部');
  const completed_Length = data?.filter(item => item.completed_at).length;
  let filterData;
  switch (tabState) {
    case '全部':
      filterData = data;
      break;
    case '待完成':
      filterData = data?.filter(item => item.completed_at === null);
      break;
    case '已完成':
      filterData = data?.filter(item => item.completed_at);
      break;
    default:
      break;
  }

  async function init() {
    let result = await getData();
    setData(result.responseJSON);
    console.log('取得資料,重新渲染');
  }
  async function getData() {
    let response = await fetch(url);
    let responseJSON = await response.json();
    return { response, responseJSON };
  }
  async function todoDELETE(id) {
    let response = await fetch(`${url}/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    const responseJSON = await response.json()
    return { response, responseJSON };
  }
  useEffect(() => {
    // init
    setTimeout(init, 1000)
  }, []);
  return (
    <div className="conatiner todoListPage vhContainer">
      <div className="todoList_Content">
        <div className="inputBox">
          <Todo_Input init={init} setData={setData} />
        </div>
        <div className="todoList_list">
          <ul className="todoList_tab">
            <TabItem setTabState={setTabState} />
          </ul>
          <div className="todoList_items">
            <ul className="todoList_item">
              {
                filterData?.length === 0 ? <Todo_NoneItem /> :
                  filterData ? filterData.map((item, i) => {
                    return (
                      <Todo_Item key={i} item={item} init={init} todoDELETE={todoDELETE} />
                    )
                  }) : <Loading />
              }
            </ul>
            <div className="todoList_statistics">
              <p> {completed_Length ? completed_Length : 0} 個已完成項目</p>
              <a href="#" onClick={
                async () => {
                  try {
                    function promiseAryFn() {
                      let promiseAry = data.map((item, i) => {
                        if (item.completed_at) {
                          return todoDELETE(item.id)
                        };
                      }).filter((item) => item !== undefined);
                      return promiseAry;
                    }
                    let res = await Promise.all(promiseAryFn());
                    res.length === 0 ? alert('目前沒有待辦') : null;
                    console.log(res);
                    await init();
                  } catch (err) {
                    console.error(err);
                    alert('網路連線異常')
                  }
                }}>清除已完成項目</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// !第二層 (最小元件)
function Todo_Input({ init }) {
  const [addInput, setAddInput] = useState('')
  async function addTodo() {
    try {
      if (addInput === '') {
        return;
      }
      setAddInput('')
      let result = await todoPOST(addInput);
      console.log('新增成功:', result);
      init();
    } catch (err) {
      console.error(err);
      alert('網路連線異常');
    }
  }
  // !放到API.JS
  async function todoPOST(content) {
    let response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({
        content,
        completed_at: null,
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    })
    let responseJSON = await response.json();
    return { response, responseJSON };
  }
  return (
    <>
      <input
        type="text"
        placeholder="請輸入待辦事項"
        value={addInput}
        onKeyPress={async (e) => {
          if (e.key === 'Enter') {
            addTodo();
          }
        }}
        onChange={(e) => setAddInput(e.target.value)} />
      <a href="#" onClick={addTodo}>
        <i className="fa fa-plus"></i>
      </a>
    </>
  )
}

function TabItem({ setTabState }) {
  const [tabData, setTabData] = useState([
    {
      state: '全部',
      className: 'active',
    },
    {
      state: '待完成',
      className: 'null',
    },
    {
      state: '已完成',
      className: 'null',
    },
  ])
  return tabData.map((item, index) => {
    return (
      <li key={index}><a href="#" className={item.className}
        onClick={() => {
          setTabState(item.state)
          const newData = tabData;
          newData.map((item, i) => {
            i === index ? (item.className = 'active') : (item.className = null)
          })
          setTabData(newData);
        }}
      >{item.state}</a></li>
    )
  })
  // (
  //   <li ><a href="#" className={className}
  //     onClick={() => {
  //       setTabState(state)
  //       const newData = tabData;
  //       newData[i].className = 'active'
  //       newData.map((item, index) => {
  //         (i !== index) ? (newData[index].className = null) : null
  //         return item;
  //       })
  //       setTabData(newData);
  //     }}
  //   >{state}</a></li>)
}

function Todo_Item({ init, item, todoDELETE }) {
  const { content, completed_at, id } = item;
  const [isLoading, setIsLoading] = useState(false)
  const checked = completed_at ? true : false
  async function checkTodo() {
    try {
      setIsLoading((prev) => !prev)
      let result = await todoPATCH();
      console.log(`修改待辦完成`, result);
      await init();
      setIsLoading((prev) => !prev)
    } catch (err) {
      console.error(err);
      alert('網路連線異常');
    }
  }
  async function todoPATCH() {
    let response = await fetch(`${url}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        completed_at: completed_at ? null : String(new Date()),
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    })
    let responseJSON = await response.json();
    return { response, responseJSON };
  }
  async function delTodo() {
    setIsLoading((prev) => !prev);
    let result = await todoDELETE(id);
    console.log(`刪除成功`, result);
    await init();
    setIsLoading((prev) => !prev);
  }
  return isLoading ? <Loading /> : (
    <li>
      <label className="todoList_label">
        <input className="todoList_input" type="checkbox" value="true"
          checked={checked} onChange={checkTodo} />
        <span>{content}</span>
      </label>
      <a href="#" onClick={delTodo}>
        <i className="fa fa-times"></i>
      </a>
    </li>
  )
}

function Todo_NoneItem() {
  return (
    <li>
      <label className="todoList_label content-center">
        <span className="loading_sapn text-gray">目前無待辦清單</span>
      </label>
    </li>
  )
}

function Loading() {
  return (
    <li>
      <label className="todoList_label content-center bg-gray">
        <span className="loading_span"><div className="loader"></div></span>
        <span>Loading...</span>
      </label>
    </li>)
}

root.render(<App />)


// todo (useEffect訓練)
// * 進來後會ul會先跑出Loading,過一會顯示資料 (R)
// * 接下來新增都不會跑出Loading (C)
// ?completed_at更改 (U)
// *add todoPost先修改成content,completed
// *根據completed渲染畫面,修改input Checked onChange
// *刪除資料 (D)

// todo2
// *tab鍵切換
// *計數已完成項目
// *刪除全部已完成資料

// todo3
// ?刪除資料時 Swal提醒     
// ESLint
// 刪除嗎 確認,刪除全部嗎 確認,
// 函式在寫好看一點 (onClick內)
// 清除已完成哪邊要Loading
//// loading美觀化

// todo4
//// 仔細想想還有什麼能useEffect
//// 元件拆檔案
// ?useContext
//// 可能拆成API資料夾導入
// 或使用Context傳prop

// todo作業需求
// 元件等級表：
// Lv1：全寫在同層
// LV2：拆出 Item，但 input 在 todolist
// LV3：全拆、Item 跟 input 全拆
// 功能等級表：
// LV1：只做新增、刪除功能
// LV2：checkbox 切換是否完成、左下角 N 個待完成項目、清除已完成
// LV3：做狀態頁籤切換，全部、待完成、已完成