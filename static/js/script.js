let showcount = "{{showcount}}" * 1;

$(document).on("click", ".input-group button", function () {
  var circuit = $(this).parents(".popover").attr("id").split("_")[0];
  var memo = $(this).siblings("textarea").val();
  var shipnum = "{{ shipnum }}";
  var csrf_token = "{{ csrf_token }}";
  var date = new Date();
  var options = {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  };
  var koreanDateTime = date.toLocaleString("ko-KR", options);
  $.ajax({
    type: "POST",
    url: "/save_memo",
    data: {
      circuit: circuit,
      memo: memo.trim(),
      shipnum: shipnum,
      memodate: koreanDateTime,
      csrfmiddlewaretoken: csrf_token,
    },
    dataType: "json",
    success: function (data) {
      if (data.status === "success") {
        document.getElementById("info").innerText =
          circuit + " 에 메모가 저장됨.";
        document.getElementById("info").style.backgroundColor = "#eaf7bd";
        if (memo.trim().length > 0) {
          $("#" + circuit + "_memo_icon").css({
            color: "red",
            "box-shadow": "2px 2px 5px #888888",
          });
        } else {
          $("#" + circuit + "_memo_icon").css({
            color: "black",
            "box-shadow": "none",
          });
        }
      } else {
        document.getElementById("info").innerText = circuit + " 저장실패.";
        document.getElementById("info").style.backgroundColor = "red;";
      }
    },
    error: function () {
      document.getElementById("info").innerText = circuit + " 저장실패.";
      document.getElementById("info").style.backgroundColor = "red;";
    },
  });
});
function checkForm(event) {
  const cirValue = document.getElementById("input_cir").value;
  const nodeValue = document.getElementById("input_node").value;
  const typeValue = document.getElementById("input_type").value;
  const blockValue = document.getElementById("input_block").value;

  if (
    cirValue.trim() === "" &&
    nodeValue.trim() === "" &&
    typeValue.trim() === "" &&
    blockValue.trim() === ""
  ) {
    document.getElementById("input_cir").value = "";
    document.getElementById("input_node").value = "";
    document.getElementById("input_type").value = "";
    document.getElementById("input_block").value = "";
    event.preventDefault();
  }
}
function autoHeight(elem) {
  elem.style.height = "1px";
  elem.style.height = elem.scrollHeight + "px";
}
const sbscheck = document.getElementById("sbscheck");

sbscheck.addEventListener("change", function () {
  if (sbscheck.checked) {
    // 체크박스가 체크되어 있으면
    const hideSbsBtns = document.querySelectorAll(".hidesb"); // 'hidesb' 클래스를 가지는 모든 버튼 가져오기

    for (let i = 0; i < hideSbsBtns.length; i++) {
      hideSbsBtns[i].classList.remove("hidesb"); // 버튼의 'hidesb' 클래스 제거
      hideSbsBtns[i].classList.add("showsb");
      const name = "sb_" + hideSbsBtns[i].innerText; // 버튼의 name 속성 가져오기
      const nodes = document.getElementsByName(name); // name 속성이 일치하는 모든 요소 가져오기
      for (let j = 0; j < nodes.length; j++) {
        nodes[j].style.display = ""; // display 속성을 ''으로 변경
      }
    }
  } else {
    // 체크박스가 체크되어 있지 않으면
    const hideSbsBtns = document.querySelectorAll(".showsb"); // 'showsb' 클래스를 가지는 모든 버튼 가져오기
    for (let i = 0; i < hideSbsBtns.length; i++) {
      hideSbsBtns[i].classList.remove("showsb"); // 버튼의 'showsb' 클래스 제거
      hideSbsBtns[i].classList.add("hidesb");
      const name = "sb_" + hideSbsBtns[i].innerText; // 버튼의 name 속성 가져오기
      const nodes = document.getElementsByName(name); // name 속성이 일치하는 모든 요소 가져오기
      for (let j = 0; j < nodes.length; j++) {
        nodes[j].style.display = "none"; // display 속성을 'none'으로 변경
      }
    }
  }
});
function sbsfilter(btn, id) {
  if (btn.classList.contains("showsb")) {
    btn.classList.remove("showsb");
    btn.classList.add("hidesb");
    document
      .querySelectorAll("[name=sb_" + btn.innerText + "]")
      .forEach((elem) => (elem.style.display = "none"));
  } else {
    btn.classList.remove("hidesb");
    btn.classList.add("showsb");
    document
      .querySelectorAll("[name=sb_" + btn.innerText + "]")
      .forEach((elem) => (elem.style.display = ""));
  }
}
function sbsbutton(btn) {
  if (btn.classList.contains("fa-caret-down")) {
    document.getElementById("setblocks").style.display = "block";
    btn.classList.remove("fa-caret-down");
    btn.classList.add("fa-caret-up");
  } else {
    document.getElementById("setblocks").style.display = "none";
    btn.classList.remove("fa-caret-up");
    btn.classList.add("fa-caret-down");
  }
}
function showLoadingPopup() {
  document
    .querySelector('meta[name="viewport"]')
    .setAttribute("content", "initial-scale=0.5");
  document.getElementById("loading-popup").style.display = "block";
  // 로딩 팝업을 표시하는 동안 페이지가 언로드 되지 않도록 이벤트 리스너를 추가합니다.
  window.addEventListener("pageshow", hideLoadingPopup);
}

function hideLoadingPopup() {
  document.getElementById("loading-popup").style.display = "none";
  document.getElementById("input_type").value = "";
  document.getElementById("input_cir").value = "";
  document.getElementById("input_node").value = "";
  document.getElementById("input_block").value = "";
}

function plusbtnclick(btn) {
  if (btn.querySelector("i").classList.contains("fa-plus")) {
    btn.querySelector("i").classList.remove("fa-plus");
    btn.querySelector("i").classList.add("fa-minus");
    document.querySelectorAll(".form-input").forEach((input) => {
      input.style.width = "120px";
    });
    document.getElementById("input_type").style.display = "";
    document.getElementById("input_block").style.display = "";
  } else {
    btn.querySelector("i").classList.remove("fa-minus");
    btn.querySelector("i").classList.add("fa-plus");
    document.querySelectorAll(".form-input").forEach((input) => {
      input.style.width = "170px";
    });
    document.getElementById("input_type").style.display = "none";
    document.getElementById("input_block").style.display = "none";
  }
}
//let count = 0;

function savenode(btn, cellId) {
  var shipnum = "{{ shipnum }}";
  var listnode = document.getElementById(
    cellId.split("_")[0] + "_node5"
  ).innerText;
  var listblockpath = document.getElementById(
    cellId.split("_")[0] + "_BlockPATH"
  ).innerText;
  var reverse = 0;
  if (document.getElementById(cellId.split("_")[0] + "_node6").innerText == 1) {
    var reverse = 1;
  }
  $.ajax({
    type: "POST",
    url: "/savenode",
    data: {
      circuit: cellId.split("_")[0],
      list_node: listnode,
      list_BlockPATH: listblockpath,
      reverse: reverse,
      shipnum: shipnum,
      csrfmiddlewaretoken: "{{ csrf_token }}",
    },
    dataType: "json",
    success: function (data) {
      document.getElementById("info").innerText =
        cellId.split("_")[0] + " node 저장됨";
      document.getElementById("info").style.backgroundColor = "#eaf7bd";
    },
    error: function () {
      document.getElementById("info").innerText =
        cellId.split("_")[0] + " Failed";
      document.getElementById("info").style.backgroundColor = "red";
    },
  });
}

function delnode(btn, cellId) {
  var shipnum = "{{ shipnum }}";
  var listnode = "";
  var reverse = 0;
  $.ajax({
    type: "POST",
    url: "/savenode",
    data: {
      circuit: cellId.split("_")[0],
      list_node: listnode,
      reverse: reverse,
      shipnum: shipnum,
      csrfmiddlewaretoken: "{{ csrf_token }}",
    },
    dataType: "json",
    success: function (data) {
      document.getElementById("info").innerText =
        cellId.split("_")[0] + " node 초기화";
      document.getElementById("info").style.backgroundColor = "#eaf7bd";
    },
    error: function () {
      document.getElementById("info").innerText =
        cellId.split("_")[0] + " Failed";
      document.getElementById("info").style.backgroundColor = "red";
    },
  });
}

function hidepopup(btn) {
  btn.style.display = "none";
}

function showpopup_1() {
  document.getElementById("popup_text").style.display = "";
}
function callen_cir(btn, cellId) {
  if (btn.innerText.indexOf("근처") >= 0) {
    document.getElementById("input_node").value = btn.innerText.replace(
      "근처",
      ""
    );
  } else {
    document.getElementById("input_cir").value = btn.innerText;
  }
}
function inputthis(btn) {
  if (btn.innerText.indexOf("-") == -1) {
    if (btn.innerText.indexOf("근처") >= 0) {
      document.getElementById("input_node").value = btn.innerText.replace(
        "근처",
        ""
      );
    } else {
      document.getElementById("input_node").value = btn.innerText;
    }
  } else {
    document.getElementById("input_cir").value = btn.innerText;
  }
}
